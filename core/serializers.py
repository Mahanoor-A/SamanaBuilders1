from rest_framework import serializers
from django.contrib.auth.models import User
from .models import UserProfile, AuditLog


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['role', 'phone', 'cnic', 'is_active']


class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'is_active', 'profile', 'last_login']
        read_only_fields = ['id', 'last_login']


class AuditLogSerializer(serializers.ModelSerializer):
    user_username = serializers.CharField(source='user.username', read_only=True, default='System')
    
    class Meta:
        model = AuditLog
        fields = ['id', 'user_username', 'action', 'model_name', 'object_id', 'description', 'ip_address', 'timestamp']
        read_only_fields = ['id', 'timestamp']
