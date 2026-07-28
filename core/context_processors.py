def user_theme_processor(request):
    """Pass the logged-in user's saved theme to all templates."""
    if request.user.is_authenticated:
        profile = getattr(request.user, 'profile', None)
        if profile:
            return {'user_theme': profile.theme}
    return {'user_theme': 'professional-blue'}
