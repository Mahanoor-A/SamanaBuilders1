from rest_framework import serializers
from .models import Project, Plot


class PlotSerializer(serializers.ModelSerializer):
    project_name = serializers.CharField(source='project.name', read_only=True)
    
    class Meta:
        model = Plot
        fields = ['id', 'plot_number', 'project', 'project_name', 'plot_type',
                  'size_marla', 'size_sqft', 'price', 'status', 'description',
                  'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def validate_price(self, value):
        if value <= 0:
            raise serializers.ValidationError('Price must be greater than 0')
        return value
    
    def validate_size_marla(self, value):
        if value <= 0:
            raise serializers.ValidationError('Size must be greater than 0')
        return value


class ProjectSerializer(serializers.ModelSerializer):
    available_plots = serializers.ReadOnlyField()
    plots = PlotSerializer(many=True, read_only=True)
    
    class Meta:
        model = Project
        fields = ['id', 'name', 'description', 'location', 'total_plots',
                  'is_active', 'available_plots', 'plots', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
