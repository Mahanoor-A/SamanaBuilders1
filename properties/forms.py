from django import forms
from .models import Project, Plot


class ProjectForm(forms.ModelForm):
    class Meta:
        model = Project
        fields = ['name', 'description', 'location', 'total_plots', 'is_active']
        widgets = {
            'name': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Project Name'}),
            'description': forms.Textarea(attrs={'class': 'form-control', 'rows': 3, 'placeholder': 'Project Description'}),
            'location': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Location'}),
            'total_plots': forms.NumberInput(attrs={'class': 'form-control', 'placeholder': 'Total Plots'}),
            'is_active': forms.CheckboxInput(attrs={'class': 'form-check-input'}),
        }


class PlotForm(forms.ModelForm):
    class Meta:
        model = Plot
        fields = ['plot_number', 'project', 'plot_type', 'size_marla', 'size_sqft', 'price', 'status', 'description']
        widgets = {
            'plot_number': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Plot Number'}),
            'project': forms.Select(attrs={'class': 'form-control'}),
            'plot_type': forms.Select(attrs={'class': 'form-control'}),
            'size_marla': forms.NumberInput(attrs={'class': 'form-control', 'placeholder': 'Size in Marla', 'step': '0.01'}),
            'size_sqft': forms.NumberInput(attrs={'class': 'form-control', 'placeholder': 'Size in Sq Ft', 'step': '0.01'}),
            'price': forms.NumberInput(attrs={'class': 'form-control', 'placeholder': 'Price in PKR', 'step': '0.01'}),
            'status': forms.Select(attrs={'class': 'form-control'}),
            'description': forms.Textarea(attrs={'class': 'form-control', 'rows': 2, 'placeholder': 'Description'}),
        }

    def clean_price(self):
        price = self.cleaned_data.get('price')
        if price and price <= 0:
            raise forms.ValidationError('Price must be greater than 0')
        return price

    def clean_size_marla(self):
        size = self.cleaned_data.get('size_marla')
        if size and size <= 0:
            raise forms.ValidationError('Size must be greater than 0')
        return size
