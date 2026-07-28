import re
from django import forms
from django.core.exceptions import ValidationError
from .models import Customer, CustomerLedgerEntry


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
                  'cnic', 'address', 'city', 'notes', 'document', 'image', 'is_active']
        widgets = {
            'first_name': forms.TextInput(attrs={'class': 'form-control', 'placeholder': ' '}),
            'last_name': forms.TextInput(attrs={'class': 'form-control', 'placeholder': ' '}),
            'email': forms.EmailInput(attrs={'class': 'form-control', 'placeholder': ' '}),
            'phone': forms.TextInput(attrs={'class': 'form-control', 'placeholder': ' '}),
            'alternate_phone': forms.TextInput(attrs={'class': 'form-control', 'placeholder': ' '}),
            'cnic': forms.TextInput(attrs={'class': 'form-control', 'placeholder': ' '}),
            'address': forms.Textarea(attrs={'class': 'form-control', 'rows': 3, 'placeholder': ' '}),
            'city': forms.TextInput(attrs={'class': 'form-control', 'placeholder': ' '}),
            'notes': forms.Textarea(attrs={'class': 'form-control', 'rows': 3, 'placeholder': ' '}),
            'document': forms.ClearableFileInput(attrs={'class': 'form-control', 'accept': '.pdf,.doc,.docx,.jpg,.jpeg,.png'}),
            'image': forms.ClearableFileInput(attrs={'class': 'form-control', 'accept': 'image/*'}),
            'is_active': forms.CheckboxInput(attrs={'class': 'form-check-input'}),
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


class CustomerLedgerEntryForm(forms.ModelForm):
    class Meta:
        model = CustomerLedgerEntry
        fields = ['customer', 'booking', 'transaction_type', 'reference_id',
                  'debit', 'credit', 'description', 'entry_date']
        widgets = {
            'customer': forms.Select(attrs={'class': 'form-control'}),
            'booking': forms.Select(attrs={'class': 'form-control'}),
            'transaction_type': forms.Select(attrs={'class': 'form-control'}),
            'reference_id': forms.TextInput(attrs={'class': 'form-control'}),
            'debit': forms.NumberInput(attrs={'class': 'form-control', 'step': '0.01'}),
            'credit': forms.NumberInput(attrs={'class': 'form-control', 'step': '0.01'}),
            'description': forms.Textarea(attrs={'class': 'form-control', 'rows': 2}),
            'entry_date': forms.DateInput(attrs={'class': 'form-control', 'type': 'date'}),
        }
    
    def clean(self):
        cleaned = super().clean()
        debit = cleaned.get('debit', 0) or 0
        credit = cleaned.get('credit', 0) or 0
        if debit == 0 and credit == 0:
            raise forms.ValidationError('Either debit or credit must be greater than 0')
        return cleaned