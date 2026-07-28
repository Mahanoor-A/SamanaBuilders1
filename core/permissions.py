from functools import wraps
from django.shortcuts import redirect
from django.contrib import messages


def role_required(*roles):
    """
    Generic decorator that checks if the user has one of the required roles.
    Three access levels: super_admin, admin, staff.
    Usage: @role_required('super_admin', 'admin')
    
    super_admin and admin can access everything.
    staff can view/create bookings/payments but NOT verify payments, delete, or manage users.
    """
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            if not request.user.is_authenticated:
                return redirect('login')
            
            # Superuser always has access
            if request.user.is_superuser:
                return view_func(request, *args, **kwargs)
            
            # Check user profile role
            if hasattr(request.user, 'profile'):
                if request.user.profile.role in roles:
                    return view_func(request, *args, **kwargs)
            
            messages.error(request, 'You do not have permission to access this page.')
            return redirect('dashboard')
        return wrapper
    return decorator


def super_admin_required(view_func):
    """Allow only super_admin role"""
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        if not request.user.is_authenticated:
            return redirect('login')
        
        if request.user.is_superuser:
            return view_func(request, *args, **kwargs)
        
        if hasattr(request.user, 'profile') and request.user.profile.role == 'super_admin':
            return view_func(request, *args, **kwargs)
        
        messages.error(request, 'You do not have permission to access this page.')
        return redirect('dashboard')
    return wrapper


def admin_or_above(view_func):
    """Allow only super_admin and admin roles"""
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        if not request.user.is_authenticated:
            return redirect('login')
        
        if request.user.is_superuser:
            return view_func(request, *args, **kwargs)
        
        if hasattr(request.user, 'profile'):
            if request.user.profile.role in ['super_admin', 'admin']:
                return view_func(request, *args, **kwargs)
        
        messages.error(request, 'You do not have permission to access this page.')
        return redirect('dashboard')
    return wrapper


def staff_or_above(view_func):
    """Allow all three levels: super_admin, admin, staff"""
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        if not request.user.is_authenticated:
            return redirect('login')
        
        if request.user.is_superuser:
            return view_func(request, *args, **kwargs)
        
        if hasattr(request.user, 'profile'):
            if request.user.profile.role in ['super_admin', 'admin', 'staff']:
                return view_func(request, *args, **kwargs)
        
        messages.error(request, 'You do not have permission to access this page.')
        return redirect('dashboard')
    return wrapper


# Legacy aliases for backward compatibility with existing views
sales_or_admin = staff_or_above
accounts_or_admin = admin_or_above
management_or_admin = admin_or_above