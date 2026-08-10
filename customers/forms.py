import re
from django import forms
from django.core.exceptions import ValidationError
from django.contrib.auth.models import User
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


class CustomerProfileForm(forms.Form):
    """Create a Django login linked to an existing Customer."""
    customer = forms.ModelChoiceField(
        queryset=Customer.objects.filter(is_active=True),
        label='Customer',
        widget=forms.Select(attrs={'class': 'form-control', 'placeholder': ' '}),
    )
    username = forms.CharField(
        max_length=150, label='Username',
        widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': ' '}),
    )
    email = forms.EmailField(
        label='Email',
        widget=forms.EmailInput(attrs={'class': 'form-control', 'placeholder': ' '}),
    )
    password = forms.CharField(
        label='Password', min_length=6,
        widget=forms.PasswordInput(attrs={'class': 'form-control', 'placeholder': ' '}),
    )
    confirm_password = forms.CharField(
        label='Confirm Password',
        widget=forms.PasswordInput(attrs={'class': 'form-control', 'placeholder': ' '}),
    )

    def clean_username(self):
        username = self.cleaned_data.get('username')
        if User.objects.filter(username=username).exists():
            raise ValidationError('Username already exists')
        return username

    def clean_email(self):
        email = self.cleaned_data.get('email')
        if User.objects.filter(email=email).exists():
            raise ValidationError('Email is already in use')
        return email

    def clean(self):
        cleaned = super().clean()
        password = cleaned.get('password')
        confirm = cleaned.get('confirm_password')
        if password and confirm and password != confirm:
            self.add_error('confirm_password', ValidationError('Passwords do not match'))
        return cleaned

    def save(self):
        customer = self.cleaned_data['customer']
        user = User(username=self.cleaned_data['username'], email=self.cleaned_data['email'])
        user.set_password(self.cleaned_data['password'])
        user.save()
        customer.user = user
        customer.save(update_fields=['user'])
        return user


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