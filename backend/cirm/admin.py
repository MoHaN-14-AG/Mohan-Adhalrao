"""
Django Admin configuration for SetuSeva CiRM.
"""

from django.contrib import admin
from .models import (
    UserProfile, Ward, Department, Citizen,
    Complaint, ServiceRequest, Feedback, WardScore
)


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'role', 'department')
    list_filter = ('role', 'department')
    search_fields = ('user__username', 'user__first_name', 'user__last_name', 'user__email')


@admin.register(Ward)
class WardAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'population')
    search_fields = ('name',)


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ('id', 'name')
    search_fields = ('name',)


@admin.register(Citizen)
class CitizenAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'phone', 'ward', 'preferred_language', 'created_at')
    list_filter = ('ward', 'preferred_language')
    search_fields = ('user__username', 'user__first_name', 'user__last_name', 'phone')


@admin.register(Complaint)
class ComplaintAdmin(admin.ModelAdmin):
    list_display = (
        'id', 'category', 'citizen', 'ward', 'department',
        'status', 'sla_due_at', 'is_duplicate', 'reopen_count', 'created_at'
    )
    list_filter = ('status', 'department', 'ward', 'is_duplicate')
    search_fields = ('category', 'description', 'location_text', 'citizen__user__username')
    readonly_fields = ('created_at', 'sla_due_at')


@admin.register(ServiceRequest)
class ServiceRequestAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'citizen', 'type', 'status', 'created_at', 'updated_at')
    list_filter = ('type', 'status')
    search_fields = ('title', 'details', 'citizen__user__username')


@admin.register(Feedback)
class FeedbackAdmin(admin.ModelAdmin):
    list_display = ('id', 'complaint', 'citizen', 'rating', 'created_at')
    list_filter = ('rating',)
    search_fields = ('comment', 'citizen__user__username')


@admin.register(WardScore)
class WardScoreAdmin(admin.ModelAdmin):
    list_display = (
        'ward', 'month', 'final_score', 'resolution_rate',
        'avg_response_hours', 'reopened_ratio', 'fund_utilisation_pct', 'calculated_at'
    )
    list_filter = ('month', 'ward')
