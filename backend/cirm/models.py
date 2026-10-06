"""
SetuSeva CIRM Database Models.
Designed specifically for Mira-Bhayandar Municipal Corporation (MBMC).

Key Design Choice:
The Citizen model is the ANCHOR TABLE. Instead of siloed systems where complaints,
applications, and feedback are detached, all citizen touchpoints link directly back
to this single anchor.
"""

from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from django.core.validators import MinValueValidator, MaxValueValidator


class RoleChoices(models.TextChoices):
    CITIZEN = 'citizen', 'Citizen'
    OFFICER = 'officer', 'Officer'
    ADMIN = 'admin', 'Admin'


class UserProfile(models.Model):
    """
    Extends standard Django User with CiRM role and officer department mapping.
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(max_length=20, choices=RoleChoices.choices, default=RoleChoices.CITIZEN)
    department = models.ForeignKey(
        'Department',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        help_text="Assigned department for Municipal Officers"
    )

    def __str__(self):
        return f"{self.user.username} ({self.role})"


class Ward(models.Model):
    """
    Represents an administrative ward within Mira-Bhayandar Municipal Corporation (MBMC).
    """
    name = models.CharField(max_length=100, unique=True)
    population = models.PositiveIntegerField(default=100000)

    def __str__(self):
        return self.name


class Department(models.Model):
    """
    Municipal Departments handling citizen grievances.
    Standard MBMC departments: Water, Sanitation, Roads, Electricity, Property Tax.
    """
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name


class Citizen(models.Model):
    """
    ANCHOR TABLE:
    The single source of truth for a resident of Mira-Bhayandar.
    Complaints, service requests, and feedback all link back here.
    """
    LANGUAGE_CHOICES = [
        ('en', 'English'),
        ('hi', 'Hindi'),
        ('mr', 'Marathi'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='citizen_profile')
    phone = models.CharField(max_length=15)
    ward = models.ForeignKey(Ward, on_delete=models.PROTECT, related_name='citizens')
    preferred_language = models.CharField(max_length=10, choices=LANGUAGE_CHOICES, default='en')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.get_full_name() or self.user.username} (Ward: {self.ward.name})"


class ComplaintStatus(models.TextChoices):
    SUBMITTED = 'submitted', 'Submitted'
    ROUTED = 'routed', 'Routed'
    IN_PROGRESS = 'in_progress', 'In Progress'
    RESOLVED = 'resolved', 'Resolved'
    CITIZEN_CONFIRMED = 'citizen_confirmed', 'Citizen Confirmed'


class Complaint(models.Model):
    """
    Citizen grievance record with strict state machine and SLA countdown.
    Lifecycle: submitted -> routed -> in_progress -> resolved -> citizen_confirmed.
    """
    citizen = models.ForeignKey(Citizen, on_delete=models.CASCADE, related_name='complaints')
    ward = models.ForeignKey(Ward, on_delete=models.PROTECT, related_name='complaints')
    department = models.ForeignKey(Department, on_delete=models.PROTECT, related_name='complaints')
    category = models.CharField(max_length=100)
    description = models.TextField()
    location_text = models.CharField(max_length=255)
    status = models.CharField(
        max_length=30,
        choices=ComplaintStatus.choices,
        default=ComplaintStatus.SUBMITTED
    )
    created_at = models.DateTimeField(default=timezone.now)
    sla_due_at = models.DateTimeField()
    resolved_at = models.DateTimeField(null=True, blank=True)
    is_duplicate = models.BooleanField(default=False, help_text="Flagged if similar complaint registered within 7 days in same ward")
    reopen_count = models.PositiveIntegerField(default=0, help_text="Number of times citizen marked problem as Not Fixed")

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['ward'], name='idx_complaint_ward'),
            models.Index(fields=['status'], name='idx_complaint_status'),
            models.Index(fields=['created_at'], name='idx_complaint_created'),
            models.Index(fields=['ward', 'status', 'created_at'], name='idx_ward_status_created'),
        ]
        constraints = [
            models.CheckConstraint(
                check=models.Q(status__in=[
                    'submitted', 'routed', 'in_progress', 'resolved', 'citizen_confirmed'
                ]),
                name='valid_complaint_status'
            )
        ]

    def is_sla_breached(self):
        """Returns True if current time is past SLA due date and not resolved."""
        if self.status == ComplaintStatus.CITIZEN_CONFIRMED or self.status == ComplaintStatus.RESOLVED:
            return False
        return timezone.now() > self.sla_due_at

    def __str__(self):
        return f"CMP-{self.id:04d} - {self.category} ({self.status})"


class ServiceRequestType(models.TextChoices):
    CERTIFICATE = 'certificate', 'Birth/Death/Zone Certificate'
    PERMIT = 'permit', 'Trade/Hawker/Building Repair Permit'
    TAX = 'tax', 'Property Tax Assessment/Water Connection'


class ServiceRequestStatus(models.TextChoices):
    DRAFT = 'draft', 'Draft'
    SUBMITTED = 'submitted', 'Submitted'
    PROCESSING = 'processing', 'Processing'
    COMPLETED = 'completed', 'Completed'
    ABANDONED = 'abandoned', 'Abandoned'


class ServiceRequest(models.Model):
    """
    Municipal services initiated by citizens.
    Drafts left unattended for > 3 days are flagged as 'abandoned' (silent friction SOP).
    """
    citizen = models.ForeignKey(Citizen, on_delete=models.CASCADE, related_name='service_requests')
    type = models.CharField(max_length=50, choices=ServiceRequestType.choices)
    title = models.CharField(max_length=150)
    details = models.TextField(blank=True, default='')
    status = models.CharField(
        max_length=30,
        choices=ServiceRequestStatus.choices,
        default=ServiceRequestStatus.SUBMITTED
    )
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status'], name='idx_servicereq_status'),
            models.Index(fields=['created_at'], name='idx_servicereq_created'),
        ]
        constraints = [
            models.CheckConstraint(
                check=models.Q(status__in=[
                    'draft', 'submitted', 'processing', 'completed', 'abandoned'
                ]),
                name='valid_service_request_status'
            )
        ]

    def __str__(self):
        return f"SR-{self.id:04d} [{self.type}] - {self.title} ({self.status})"


class Feedback(models.Model):
    """
    Citizen satisfaction rating collected upon verified ticket closure.
    """
    citizen = models.ForeignKey(Citizen, on_delete=models.CASCADE, related_name='feedback_records')
    complaint = models.OneToOneField(Complaint, on_delete=models.CASCADE, related_name='feedback')
    rating = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text="Rating on a 1-5 scale (1 = Poor, 5 = Excellent)"
    )
    comment = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.CheckConstraint(
                check=models.Q(rating__gte=1) & models.Q(rating__lte=5),
                name='valid_rating_range_1_to_5'
            )
        ]

    def __str__(self):
        return f"Feedback for CMP-{self.complaint_id}: {self.rating}/5 stars"


class WardScore(models.Model):
    """
    Accountability index calculated per ward based on:
    - 40% Resolution Rate
    - 25% Speed (SLA responsiveness)
    - 15% (1 - Reopened Ratio)
    - 20% Fund Utilisation (from MBMC financial data)
    """
    ward = models.ForeignKey(Ward, on_delete=models.CASCADE, related_name='scores')
    month = models.CharField(max_length=20, help_text="e.g. October 2026")
    resolution_rate = models.FloatField(help_text="Percentage of complaints resolved")
    avg_response_hours = models.FloatField(help_text="Average time taken to resolve in hours")
    reopened_ratio = models.FloatField(help_text="Ratio of reopened tickets to resolved tickets")
    fund_utilisation_pct = models.FloatField(help_text="Fund expenditure efficiency %")
    final_score = models.FloatField(help_text="Weighted composite accountability score out of 100")
    calculated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-final_score']
        unique_together = ('ward', 'month')

    def __str__(self):
        return f"{self.ward.name} ({self.month}): {self.final_score:.1f}/100"
