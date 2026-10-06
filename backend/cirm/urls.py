"""
API URL Routing for SetuSeva CiRM endpoints.
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    register_citizen, login_user, current_user, admin_stats,
    WardViewSet, DepartmentViewSet, ComplaintViewSet,
    ServiceRequestViewSet, FeedbackViewSet, WardScoreViewSet
)

router = DefaultRouter()
router.register(r'wards', WardViewSet, basename='ward')
router.register(r'departments', DepartmentViewSet, basename='department')
router.register(r'complaints', ComplaintViewSet, basename='complaint')
router.register(r'service-requests', ServiceRequestViewSet, basename='servicerequest')
router.register(r'feedback', FeedbackViewSet, basename='feedback')
router.register(r'ward-scores', WardScoreViewSet, basename='wardscore')

urlpatterns = [
    # Authentication endpoints
    path('auth/register/', register_citizen, name='register_citizen'),
    path('auth/login/', login_user, name='login_user'),
    path('auth/me/', current_user, name='current_user'),

    # Admin KPI stats endpoint
    path('admin/stats/', admin_stats, name='admin_stats'),

    # Router-generated CRUD endpoints
    path('', include(router.urls)),
]
