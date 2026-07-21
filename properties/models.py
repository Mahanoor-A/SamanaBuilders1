from django.db import models
from django.contrib.auth.models import User


class Project(models.Model):
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    location = models.CharField(max_length=200)
    total_plots = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.name
    
    @property
    def available_plots(self):
        return self.plots.filter(status='available').count()
    
    class Meta:
        verbose_name_plural = 'Projects'


class Plot(models.Model):
    STATUS_CHOICES = [
        ('available', 'Available'),
        ('reserved', 'Reserved'),
        ('booked', 'Booked'),
        ('sold', 'Sold'),
        ('cancelled', 'Cancelled'),
    ]
    
    TYPE_CHOICES = [
        ('residential', 'Residential'),
        ('commercial', 'Commercial'),
        ('industrial', 'Industrial'),
    ]
    
    plot_number = models.CharField(max_length=50)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='plots')
    plot_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='residential')
    size_marla = models.DecimalField(max_digits=10, decimal_places=2, help_text="Size in Marla")
    size_sqft = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True, help_text="Size in Square Feet")
    price = models.DecimalField(max_digits=15, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='available')
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.project.name} - {self.plot_number}"
    
    class Meta:
        unique_together = ['project', 'plot_number']
        ordering = ['project', 'plot_number']
