from django import template
from properties.models import Project

register = template.Library()


@register.simple_tag
def has_mappable_projects():
    """Check if any projects have latitude/longitude set."""
    return Project.objects.filter(
        latitude__isnull=False,
        longitude__isnull=False
    ).exclude(status='inactive').exists()
