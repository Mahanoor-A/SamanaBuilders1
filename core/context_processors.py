from .permissions import get_user_role, MANAGEMENT_ROLES, ADMIN_ROLES, PAYMENTS_ACCESS_ROLES, FINANCE_ROLES


def user_theme_processor(request):
    """Pass the logged-in user's saved theme to all templates."""
    if request.user.is_authenticated:
        profile = getattr(request.user, 'profile', None)
        if profile:
            return {'user_theme': profile.theme}
    return {'user_theme': 'professional-blue'}


def erp_context(request):
    """Pass role + permission flags to all templates for role-aware UI."""
    from django.conf import settings
    role = get_user_role(request)
    return {
        'user_role': role,
        'can_view_payments': role in PAYMENTS_ACCESS_ROLES,
        'can_view_expenses': role in FINANCE_ROLES,
        'can_manage_users': role in ADMIN_ROLES,
        'can_view_users': role in MANAGEMENT_ROLES,
        'can_backup': role in ADMIN_ROLES,
        'can_audit': role in MANAGEMENT_ROLES,
        'can_delete': role in MANAGEMENT_ROLES,
        'whatsapp_number': getattr(settings, 'WHATSAPP_PHONE_NUMBER', ''),
    }
