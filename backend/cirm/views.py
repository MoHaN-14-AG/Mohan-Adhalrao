"""
Django REST Framework Views for SetuSeva CiRM.
Handles Authentication, Keyword Routing, Duplicate Checking, State Machine
Transitions, Citizen-Verified Closure, and Ward Accountability Reporting.
"""

from datetime import timedelta
from django.utils import timezone
from django.db.models import Avg, Count, F, ExpressionWrapper, fields
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.authtoken.models import Token

from .models import (
    UserProfile, RoleChoices, Ward, Department, Citizen,
    Complaint, ComplaintStatus, ServiceRequest, ServiceRequestStatus,
    Feedback, WardScore
)
from .serializers import (
    UserSerializer, WardSerializer, DepartmentSerializer, CitizenSerializer,
    ComplaintSerializer, ServiceRequestSerializer, FeedbackSerializer, WardScoreSerializer
)
from .routing_rules import determine_department_by_keywords


# ==============================================================================
# AUTHENTICATION VIEWS
# ==============================================================================

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def register_citizen(request):
    """
    Registers a new resident and creates their Citizen anchor record.
    """
    data = request.data
    username = data.get('username', '').strip()
    password = data.get('password', '')
    first_name = data.get('first_name', '').strip()
    last_name = data.get('last_name', '').strip()
    email = data.get('email', '').strip()
    phone = data.get('phone', '').strip()
    ward_id = data.get('ward')
    preferred_language = data.get('preferred_language', 'en')

    if not username or not password or not phone or not ward_id:
        return Response(
            {'error': 'Username, password, phone, and ward are required.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    if User.objects.filter(username=username).exists():
        return Response(
            {'error': 'Username already taken.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        ward = Ward.objects.get(id=ward_id)
    except Ward.DoesNotExist:
        return Response({'error': 'Invalid ward selected.'}, status=status.HTTP_400_BAD_REQUEST)

    # 1. Create standard Django User
    user = User.objects.create_user(
        username=username,
        password=password,
        email=email,
        first_name=first_name,
        last_name=last_name
    )

    # 2. Attach UserProfile with role 'citizen'
    UserProfile.objects.create(user=user, role=RoleChoices.CITIZEN)

    # 3. Create the ANCHOR Citizen record
    citizen = Citizen.objects.create(
        user=user,
        phone=phone,
        ward=ward,
        preferred_language=preferred_language
    )

    token, _ = Token.objects.get_or_create(user=user)

    return Response({
        'token': token.key,
        'user': UserSerializer(user).data,
        'citizen': CitizenSerializer(citizen).data
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def login_user(request):
    """
    Authenticates user and returns auth token with role and profile context.
    """
    username = request.data.get('username')
    password = request.data.get('password')

    user = authenticate(username=username, password=password)
    if not user:
        return Response(
            {'error': 'Invalid username or password.'},
            status=status.HTTP_401_UNAUTHORIZED
        )

    token, _ = Token.objects.get_or_create(user=user)
    profile = getattr(user, 'profile', None)
    role = profile.role if profile else ('admin' if user.is_staff else 'citizen')

    citizen_data = None
    if hasattr(user, 'citizen_profile'):
        citizen_data = CitizenSerializer(user.citizen_profile).data

    return Response({
        'token': token.key,
        'user': UserSerializer(user).data,
        'role': role,
        'department': profile.department.name if profile and profile.department else None,
        'citizen': citizen_data
    })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def current_user(request):
    """
    Returns logged in user details, role, and citizen anchor data.
    """
    user = request.user
    profile = getattr(user, 'profile', None)
    role = profile.role if profile else ('admin' if user.is_staff else 'citizen')

    citizen_data = None
    if hasattr(user, 'citizen_profile'):
        citizen_data = CitizenSerializer(user.citizen_profile).data

    return Response({
        'user': UserSerializer(user).data,
        'role': role,
        'department': profile.department.name if profile and profile.department else None,
        'citizen': citizen_data
    })


# ==============================================================================
# REFERENCE DATA VIEWSETS
# ==============================================================================

class WardViewSet(viewsets.ReadOnlyModelViewSet):
    """List and detail views for MBMC Wards."""
    queryset = Ward.objects.all().order_by('id')
    serializer_class = WardSerializer
    permission_classes = [permissions.AllowAny]


class DepartmentViewSet(viewsets.ReadOnlyModelViewSet):
    """List and detail views for MBMC Departments."""
    queryset = Department.objects.all().order_by('name')
    serializer_class = DepartmentSerializer
    permission_classes = [permissions.AllowAny]


# ==============================================================================
# COMPLAINT VIEWSET (Routing, Duplicates, Lifecycle)
# ==============================================================================

class ComplaintViewSet(viewsets.ModelViewSet):
    """
    Core Complaint handling with role isolation:
    - Citizen: only views and submits their own complaints
    - Officer: only views complaints assigned to their department
    - Admin: views all complaints across MBMC
    """
    serializer_class = ComplaintSerializer

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Complaint.objects.none()

        profile = getattr(user, 'profile', None)
        role = profile.role if profile else ('admin' if user.is_staff else 'citizen')

        if role == RoleChoices.ADMIN or user.is_superuser:
            qs = Complaint.objects.all()
        elif role == RoleChoices.OFFICER and profile and profile.department:
            qs = Complaint.objects.filter(department=profile.department)
        elif hasattr(user, 'citizen_profile'):
            qs = Complaint.objects.filter(citizen=user.citizen_profile)
        else:
            qs = Complaint.objects.none()

        # Optional query filters
        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)

        ward_id = self.request.query_params.get('ward')
        if ward_id:
            qs = qs.filter(ward_id=ward_id)

        department_id = self.request.query_params.get('department')
        if department_id:
            qs = qs.filter(department_id=department_id)

        return qs.select_related('ward', 'department', 'citizen__user')

    def perform_create(self, serializer):
        """
        Creates complaint with:
        1. Auto-routing using Keyword Rules
        2. Duplicate detection (same category + same ward in last 7 days)
        3. Automatic SLA timestamp (72 hours SLA)
        """
        user = self.request.user
        if not hasattr(user, 'citizen_profile'):
            raise serializers.ValidationError("Only registered citizens can lodge complaints.")

        citizen = user.citizen_profile
        ward = serializer.validated_data.get('ward') or citizen.ward
        category = serializer.validated_data.get('category', '')
        description = serializer.validated_data.get('description', '')

        # 1. SIMPLE KEYWORD ROUTING (Transparent rule matching)
        combined_text = f"{category} {description}"
        dept_name, routing_note = determine_department_by_keywords(combined_text)

        department, _ = Department.objects.get_or_create(name=dept_name)

        # 2. DUPLICATE DETECTION
        # Check if the same category + same ward has a complaint in the last 7 days
        seven_days_ago = timezone.now() - timedelta(days=7)
        has_duplicate = Complaint.objects.filter(
            ward=ward,
            category__iexact=category.strip(),
            created_at__gte=seven_days_ago
        ).exists()

        # 3. SET SLA DUE DATE (72 Hours standard SLA)
        sla_due_at = timezone.now() + timedelta(hours=72)

        serializer.save(
            citizen=citizen,
            ward=ward,
            department=department,
            status=ComplaintStatus.SUBMITTED,
            sla_due_at=sla_due_at,
            is_duplicate=has_duplicate
        )

    @action(detail=True, methods=['patch'], url_path='update-status')
    def update_status(self, request, pk=None):
        """
        Enforces strict lifecycle state machine:
        submitted -> routed -> in_progress -> resolved -> citizen_confirmed
        """
        complaint = self.get_object()
        new_status = request.data.get('status')
        user = request.user
        profile = getattr(user, 'profile', None)
        role = profile.role if profile else ('admin' if user.is_staff else 'citizen')

        # Define valid transitions
        ALLOWED_TRANSITIONS = {
            ComplaintStatus.SUBMITTED: [ComplaintStatus.ROUTED, ComplaintStatus.IN_PROGRESS],
            ComplaintStatus.ROUTED: [ComplaintStatus.IN_PROGRESS],
            ComplaintStatus.IN_PROGRESS: [ComplaintStatus.RESOLVED],
            ComplaintStatus.RESOLVED: [ComplaintStatus.CITIZEN_CONFIRMED, ComplaintStatus.IN_PROGRESS],
            ComplaintStatus.CITIZEN_CONFIRMED: []  # Final state
        }

        current = complaint.status

        if new_status not in ALLOWED_TRANSITIONS.get(current, []):
            return Response(
                {'error': f"Invalid status transition from '{current}' to '{new_status}'."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Only citizen can confirm closure
        if new_status == ComplaintStatus.CITIZEN_CONFIRMED:
            if role != RoleChoices.CITIZEN or complaint.citizen.user != user:
                return Response(
                    {'error': "Only the reporting citizen can confirm resolution of this complaint."},
                    status=status.HTTP_403_FORBIDDEN
                )

        complaint.status = new_status
        if new_status == ComplaintStatus.RESOLVED and not complaint.resolved_at:
            complaint.resolved_at = timezone.now()
        elif new_status == ComplaintStatus.CITIZEN_CONFIRMED and not complaint.resolved_at:
            complaint.resolved_at = timezone.now()

        complaint.save()
        return Response(ComplaintSerializer(complaint).data)

    @action(detail=True, methods=['post'], url_path='reopen')
    def reopen(self, request, pk=None):
        """
        CITIZEN-VERIFIED CLOSURE:
        If the citizen inspects the work and clicks 'Not Fixed',
        the ticket reverts to 'in_progress' and reopen_count increments.
        """
        complaint = self.get_object()
        user = request.user

        if complaint.citizen.user != user and not user.is_superuser:
            return Response(
                {'error': "Only the reporting citizen can reopen this complaint."},
                status=status.HTTP_403_FORBIDDEN
            )

        if complaint.status != ComplaintStatus.RESOLVED:
            return Response(
                {'error': "Only resolved complaints awaiting confirmation can be reopened."},
                status=status.HTTP_400_BAD_REQUEST
            )

        complaint.status = ComplaintStatus.IN_PROGRESS
        complaint.reopen_count += 1
        complaint.resolved_at = None
        complaint.save()

        return Response({
            'message': 'Complaint reopened and reassigned to field team.',
            'complaint': ComplaintSerializer(complaint).data
        })


# ==============================================================================
# SERVICE REQUESTS VIEWSET (Silent friction tracking)
# ==============================================================================

class ServiceRequestViewSet(viewsets.ModelViewSet):
    """
    Handles applications for Certificates, Permits, and Tax assessments.
    """
    serializer_class = ServiceRequestSerializer

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return ServiceRequest.objects.none()

        profile = getattr(user, 'profile', None)
        role = profile.role if profile else ('admin' if user.is_staff else 'citizen')

        if role in [RoleChoices.ADMIN, RoleChoices.OFFICER] or user.is_superuser:
            return ServiceRequest.objects.all().select_related('citizen__user')
        elif hasattr(user, 'citizen_profile'):
            return ServiceRequest.objects.filter(citizen=user.citizen_profile)
        return ServiceRequest.objects.none()

    def perform_create(self, serializer):
        user = self.request.user
        if not hasattr(user, 'citizen_profile'):
            raise serializers.ValidationError("Only registered citizens can initiate service requests.")

        initial_status = self.request.data.get('status', ServiceRequestStatus.SUBMITTED)
        serializer.save(
            citizen=user.citizen_profile,
            status=initial_status
        )

    @action(detail=True, methods=['patch'], url_path='update-status')
    def update_status(self, request, pk=None):
        req = self.get_object()
        new_status = request.data.get('status')
        if new_status not in ServiceRequestStatus.values:
            return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)
        req.status = new_status
        req.save()
        return Response(ServiceRequestSerializer(req).data)


# ==============================================================================
# FEEDBACK VIEWSET (Post-closure satisfaction)
# ==============================================================================

class FeedbackViewSet(viewsets.ModelViewSet):
    """
    Collects citizen rating 1-5 and comment after verified resolution.
    """
    serializer_class = FeedbackSerializer

    def get_queryset(self):
        return Feedback.objects.all().select_related('citizen__user', 'complaint')

    def perform_create(self, serializer):
        user = self.request.user
        if not hasattr(user, 'citizen_profile'):
            raise serializers.ValidationError("Only citizens can provide feedback.")

        complaint = serializer.validated_data.get('complaint')
        if complaint.citizen.user != user:
            raise serializers.ValidationError("You can only submit feedback for your own complaint.")

        if complaint.status != ComplaintStatus.CITIZEN_CONFIRMED and complaint.status != ComplaintStatus.RESOLVED:
            raise serializers.ValidationError("Feedback can only be submitted after complaint resolution.")

        serializer.save(citizen=user.citizen_profile)


# ==============================================================================
# WARD SCORES VIEWSET (Publicly visible accountability)
# ==============================================================================

class WardScoreViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Publicly accessible Ward Scorecard. No authentication required.
    """
    queryset = WardScore.objects.all().select_related('ward').order_by('-final_score')
    serializer_class = WardScoreSerializer
    permission_classes = [permissions.AllowAny]


# ==============================================================================
# ADMIN DASHBOARD STATS API
# ==============================================================================

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def admin_stats(request):
    """
    Aggregates high-level municipal CiRM KPIs for MBMC administration.
    """
    user = request.user
    profile = getattr(user, 'profile', None)
    role = profile.role if profile else ('admin' if user.is_staff else 'citizen')

    if role not in [RoleChoices.ADMIN, RoleChoices.OFFICER] and not user.is_superuser:
        return Response({'error': 'Admin or officer privilege required.'}, status=status.HTTP_403_FORBIDDEN)

    now = timezone.now()

    # Total complaints
    total_complaints = Complaint.objects.count()

    # Active complaints
    active_complaints = Complaint.objects.exclude(
        status__in=[ComplaintStatus.RESOLVED, ComplaintStatus.CITIZEN_CONFIRMED]
    ).count()

    # Resolved count
    resolved_complaints = Complaint.objects.filter(
        status__in=[ComplaintStatus.RESOLVED, ComplaintStatus.CITIZEN_CONFIRMED]
    ).count()

    # SLA Breaches (active tickets past sla_due_at)
    sla_breaches = Complaint.objects.exclude(
        status__in=[ComplaintStatus.RESOLVED, ComplaintStatus.CITIZEN_CONFIRMED]
    ).filter(sla_due_at__lt=now).count()

    # Average resolution time in hours for resolved tickets
    resolved_tickets = Complaint.objects.filter(
        resolved_at__isnull=False
    )
    if resolved_tickets.exists():
        durations = []
        for t in resolved_tickets:
            diff_hours = (t.resolved_at - t.created_at).total_seconds() / 3600.0
            durations.append(diff_hours)
        avg_resolution_hours = round(sum(durations) / len(durations), 1)
    else:
        avg_resolution_hours = 0.0

    # Complaints by department / category breakdown
    category_counts = list(
        Complaint.objects.values('category').annotate(count=Count('id')).order_by('-count')[:8]
    )

    department_counts = list(
        Complaint.objects.values('department__name').annotate(count=Count('id')).order_by('-count')
    )

    # Service requests breakdown & abandoned count (Silent friction SOP)
    abandoned_requests_count = ServiceRequest.objects.filter(
        status=ServiceRequestStatus.ABANDONED
    ).count()

    total_service_requests = ServiceRequest.objects.count()

    return Response({
        'total_complaints': total_complaints,
        'active_complaints': active_complaints,
        'resolved_complaints': resolved_complaints,
        'sla_breaches': sla_breaches,
        'avg_resolution_hours': avg_resolution_hours,
        'abandoned_requests_count': abandoned_requests_count,
        'total_service_requests': total_service_requests,
        'category_counts': category_counts,
        'department_counts': department_counts,
    })
