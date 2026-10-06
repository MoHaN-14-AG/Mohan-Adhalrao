"""
Django REST Framework Serializers for SetuSeva CiRM.
Simple, beginner-friendly serializers with explicit field definitions.
"""

from rest_framework import serializers
from django.contrib.auth.models import User
from .models import (
    UserProfile, Ward, Department, Citizen,
    Complaint, ServiceRequest, Feedback, WardScore, ComplaintStatus
)


class UserProfileSerializer(serializers.ModelSerializer):
    department_name = serializers.ReadOnlyField(source='department.name')

    class Meta:
        model = UserProfile
        fields = ['role', 'department', 'department_name']


class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'profile']


class WardSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ward
        fields = ['id', 'name', 'population']


class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = ['id', 'name']


class CitizenSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    ward_name = serializers.ReadOnlyField(source='ward.name')

    class Meta:
        model = Citizen
        fields = ['id', 'user', 'phone', 'ward', 'ward_name', 'preferred_language', 'created_at']


class FeedbackSerializer(serializers.ModelSerializer):
    citizen_name = serializers.ReadOnlyField(source='citizen.user.get_full_name')

    class Meta:
        model = Feedback
        fields = ['id', 'complaint', 'citizen', 'citizen_name', 'rating', 'comment', 'created_at']
        read_only_fields = ['citizen', 'created_at']

    def validate_rating(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError("Rating must be between 1 and 5.")
        return value


class ComplaintSerializer(serializers.ModelSerializer):
    ward_name = serializers.ReadOnlyField(source='ward.name')
    department_name = serializers.ReadOnlyField(source='department.name')
    citizen_name = serializers.ReadOnlyField(source='citizen.user.get_full_name')
    citizen_phone = serializers.ReadOnlyField(source='citizen.phone')
    is_sla_breached = serializers.SerializerMethodField()
    feedback = FeedbackSerializer(read_only=True)

    class Meta:
        model = Complaint
        fields = [
            'id', 'citizen', 'citizen_name', 'citizen_phone', 'ward', 'ward_name',
            'department', 'department_name', 'category', 'description', 'location_text',
            'status', 'created_at', 'sla_due_at', 'resolved_at', 'is_duplicate',
            'reopen_count', 'is_sla_breached', 'feedback'
        ]
        read_only_fields = [
            'citizen', 'department', 'sla_due_at', 'resolved_at',
            'is_duplicate', 'reopen_count', 'created_at'
        ]

    def get_is_sla_breached(self, obj) -> bool:
        return obj.is_sla_breached()


class ServiceRequestSerializer(serializers.ModelSerializer):
    citizen_name = serializers.ReadOnlyField(source='citizen.user.get_full_name')

    class Meta:
        model = ServiceRequest
        fields = ['id', 'citizen', 'citizen_name', 'type', 'title', 'details', 'status', 'created_at', 'updated_at']
        read_only_fields = ['citizen', 'created_at', 'updated_at']


class WardScoreSerializer(serializers.ModelSerializer):
    ward_name = serializers.ReadOnlyField(source='ward.name')
    population = serializers.ReadOnlyField(source='ward.population')

    class Meta:
        model = WardScore
        fields = [
            'id', 'ward', 'ward_name', 'population', 'month',
            'resolution_rate', 'avg_response_hours', 'reopened_ratio',
            'fund_utilisation_pct', 'final_score', 'calculated_at'
        ]
