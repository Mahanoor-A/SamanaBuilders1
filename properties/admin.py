from django.contrib import admin
from .models import Project, Plot


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ['name', 'location', 'total_plots', 'is_active', 'created_at']
    search_fields = ['name', 'location']
    list_filter = ['is_active']


@admin.register(Plot)
class PlotAdmin(admin.ModelAdmin):
    list_display = ['plot_number', 'project', 'plot_type', 'size_marla', 'price', 'status']
    search_fields = ['plot_number', 'project__name']
    list_filter = ['status', 'plot_type', 'project']
    readonly_fields = ['created_at', 'updated_at']
