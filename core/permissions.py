from functools import wraps
from django.shortcuts import redirect
from django.contrib import messages
from django.http import HttpResponseForbidden


def role_required(*roles):
    """
    Decorator that checks if the user has one of the required roles.
    Usage: @role_required('super_admin', 'admin')
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


def sales_or_admin(view_func):
    """Allow only Sales, Admin, or Super Admin roles"""
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        if not request.user.is_authenticated:
            return redirect('login')
        
        if request.user.is_superuser:
            return view_func(request, *args, **kwargs)
        
        if hasattr(request.user, 'profile'):
            if request.user.profile.role in ['super_admin', 'admin', 'sales']:
                return view_func(request, *args, **kwargs)
        
        messages.error(request, 'You do not have permission to access this page.')
        return redirect('dashboard')
    return wrapper


def accounts_or_admin(view_func):
    """Allow only Accounts, Admin, or Super Admin roles"""
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        if not request.user.is_authenticated:
            return redirect('login')
        
        if request.user.is_superuser:
            return view_func(request, *args, **kwargs)
        
        if hasattr(request.user, 'profile'):
            if request.user.profile.role in ['super_admin', 'admin', 'accounts']:
                return view_func(request, *args, **kwargs)
        
        messages.error(request, 'You do not have permission to access this page.')
        return redirect('dashboard')
    return wrapper


def management_or_admin(view_func):
    """Allow only Management, Admin, or Super Admin roles"""
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        if not request.user.is_authenticated:
            return redirect('login')
        
        if request.user.is_superuser:
            return view_func(request, *args, **kwargs)
        
        if hasattr(request.user, 'profile'):
            if request.user.profile.role in ['super_admin', 'admin', 'management']:
                return view_func(request, *args, **kwargs)
        
        messages.error(request, 'You do not have permission to access this page.')
        return redirect('dashboard')
    return wrapper
