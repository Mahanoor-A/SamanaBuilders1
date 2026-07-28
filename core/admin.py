from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.models import User
from .models import UserProfile, AuditLog, LoginAttempt, ApprovalChain, ApprovalStep, ApprovalRequest


class UserProfileInline(admin.StackedInline):
    model = UserProfile
    can_delete = False
    fields = ['role', 'phone', 'cnic', 'is_active']


class CustomUserAdmin(UserAdmin):
    inlines = (UserProfileInline,)
    list_display = ['username', 'email', 'first_name', 'last_name', 'get_role', 'is_active', 'last_login']
    list_filter = ['is_active', 'date_joined']
    
    def get_role(self, obj):
        if hasattr(obj, 'profile'):
            return obj.profile.get_role_display()
        return '-'
    get_role.short_description = 'Role'
    get_role.admin_order_field = 'profile__role'


admin.site.unregister(User)
admin.site.register(User, CustomUserAdmin)


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'role', 'phone', 'cnic', 'is_active', 'created_at']
    list_filter = ['role', 'is_active']
    search_fields = ['user__username', 'user__email', 'phone', 'cnic']


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ['user', 'action', 'model_name', 'object_id', 'timestamp']
    list_filter = ['action', 'model_name', 'timestamp']
    search_fields = ['user__username', 'model_name', 'object_id', 'description']
    readonly_fields = ['user', 'action', 'model_name', 'object_id', 'description', 'ip_address', 'timestamp']
    
    def has_add_permission(self, request):
        return False
    
    def has_change_permission(self, request):
        return False


@admin.register(LoginAttempt)
class LoginAttemptAdmin(admin.ModelAdmin):
    list_display = ['username', 'ip_address', 'is_success', 'timestamp']
    list_filter = ['is_success', 'timestamp']
    search_fields = ['username', 'ip_address']
    readonly_fields = ['username', 'ip_address', 'is_success', 'timestamp']
    
    def has_add_permission(self, request):
        return False
    
    def has_change_permission(self, request):
        return False


@admin.register(ApprovalChain)
class ApprovalChainAdmin(admin.ModelAdmin):
    list_display = ['name', 'model_name', 'is_active', 'created_at']
    list_filter = ['is_active']


@admin.register(ApprovalStep)
class ApprovalStepAdmin(admin.ModelAdmin):
    list_display = ['chain', 'step_order', 'role', 'min_amount', 'max_amount']
    list_filter = ['role']
    search_fields = ['chain__name']


@admin.register(ApprovalRequest)
class ApprovalRequestAdmin(admin.ModelAdmin):
    list_display = ['object_type', 'object_id', 'requested_by', 'status', 'created_at', 'reviewed_at']
    list_filter = ['status', 'object_type']
    search_fields = ['object_id', 'requested_by__username']
    readonly_fields = ['created_at', 'reviewed_at']