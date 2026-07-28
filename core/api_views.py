from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth.models import User
from .models import UserProfile, AuditLog
from .serializers import (UserSerializer, UserCreateSerializer,
                           UserProfileSerializer, AuditLogSerializer)


class IsAdminOrReadOnly(permissions.BasePermission):
    """Allow read for all authenticated, write only for admin/super_admin."""
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.method in permissions.SAFE_METHODS:
            return True
        return (
            request.user.is_superuser or
            (hasattr(request.user, 'profile') and
             request.user.profile.role in ['super_admin', 'admin'])
        )


class IsSuperAdmin(permissions.BasePermission):
    """Allow only super_admin role."""
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True
        return (
            hasattr(request.user, 'profile') and
            request.user.profile.role == 'super_admin'
        )


class IsStaffOrAbove(permissions.BasePermission):
    """Allow all three levels: super_admin, admin, staff."""
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True
        if hasattr(request.user, 'profile'):
            return request.user.profile.role in ['super_admin', 'admin', 'staff']
        return False


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.select_related('profile').all()
    serializer_class = UserSerializer
    permission_classes = [IsAdminOrReadOnly]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        return UserSerializer
    
    def perform_create(self, serializer):
        user = serializer.save()
        AuditLog.objects.create(
            user=self.request.user, action='create', model_name='User',
            object_id=user.username,
            description=f'Created user {user.username} via API'
        )
    
    @action(detail=False, methods=['get', 'patch'])
    def me(self, request):
        if request.method == 'GET':
            serializer = self.get_serializer(request.user)
            return Response(serializer.data)
        elif request.method == 'PATCH':
            serializer = UserSerializer(
                request.user, data=request.data, partial=True
            )
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def toggle_active(self, request, pk=None):
        """Toggle user active status (admin only)."""
        user = self.get_object()
        if user == request.user:
            return Response(
                {'error': 'You cannot deactivate your own account.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        user.is_active = not user.is_active
        user.save()
        AuditLog.objects.create(
            user=request.user, action='update', model_name='User',
            object_id=user.username,
            description=f'{"Deactivated" if not user.is_active else "Activated"} user {user.username} via API'
        )
        return Response(UserSerializer(user).data)


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AuditLog.objects.select_related('user').all()
    serializer_class = AuditLogSerializer
    permission_classes = [IsAdminOrReadOnly]
    
    def get_queryset(self):
        qs = super().get_queryset()
        action_filter = self.request.query_params.get('action')
        model_filter = self.request.query_params.get('model')
        if action_filter:
            qs = qs.filter(action=action_filter)
        if model_filter:
            qs = qs.filter(model_name=model_filter)
        return qs[:100]  # Limit to latest 100


class ProfileViewSet(viewsets.GenericViewSet):
    """Self-service profile endpoint."""
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def list(self, request):
        profile = getattr(request.user, 'profile', None)
        if not profile:
            return Response({'error': 'No profile found'}, status=404)
        serializer = self.get_serializer(profile)
        return Response(serializer.data)
    
    @action(detail=False, methods=['patch'])
    def update_profile(self, request):
        profile = getattr(request.user, 'profile', None)
        if not profile:
            return Response({'error': 'No profile found'}, status=404)
        serializer = self.get_serializer(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)