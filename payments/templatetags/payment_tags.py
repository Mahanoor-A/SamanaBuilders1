from django import template

register = template.Library()


@register.filter
def get_item(value, key):
    """Safely get a key from a dict without raising VariableDoesNotExist."""
    if isinstance(value, dict):
        return value.get(key, '')
    return ''
