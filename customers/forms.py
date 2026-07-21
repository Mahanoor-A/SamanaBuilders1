import re
from django import forms
from django.core.exceptions import ValidationError
from .models import Customer


def validate_cnic(value):
    pattern = r'^\d{5}-\d{7}-\d{1}$'
    if not re.match(pattern, value):
        raise ValidationError('CNIC format must be XXXXX-XXXXXXX-X')


def validate_phone(value):
    pattern = r'^\+?[\d\-]{10,15}$'
    if not re.match(pattern, value):
        raise ValidationError('Enter a valid phone number (10-15 digits)')


class CustomerForm(forms.ModelForm):
    class Meta:
        model = Customer
        fields = ['first_name', 'last_name', 'email', 'phone', 'alternate_phone',
                  'cnic', 'address', 'city', 'notes']
        widgets = {
            'first_name': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'First Name'}),
            'last_name': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Last Name'}),
            'email': forms.EmailInput(attrs={'class': 'form-control', 'placeholder': 'email@example.com'}),
            'phone': forms.TextInput(attrs={'class': 'form-control', 'placeholder': '+92-XXX-XXXXXXX'}),
            'alternate_phone': forms.TextInput(attrs={'class': 'form-control', 'placeholder': '+92-XXX-XXXXXXX'}),
            'cnic': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'XXXXX-XXXXXXX-X'}),
            'address': forms.Textarea(attrs={'class': 'form-control', 'rows': 3, 'placeholder': 'Full Address'}),
            'city': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'City'}),
            'notes': forms.Textarea(attrs={'class': 'form-control', 'rows': 2, 'placeholder': 'Additional notes...'}),
        }

    def clean_cnic(self):
        cnic = self.cleaned_data.get('cnic')
        validate_cnic(cnic)
        return cnic

    def clean_phone(self):
        phone = self.cleaned_data.get('phone')
        validate_phone(phone)
        return phone

    def clean_alternate_phone(self):
        phone = self.cleaned_data.get('alternate_phone')
        if phone:
            validate_phone(phone)
        return phone
