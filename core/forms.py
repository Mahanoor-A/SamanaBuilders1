from django import forms
from django.contrib.auth.models import User
from .models import UserProfile


class UserForm(forms.ModelForm):
    """Form for editing User fields."""
    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'email', 'is_active']
        widgets = {
            'first_name': forms.TextInput(attrs={'class': 'form-control', 'placeholder': ' '}),
            'last_name': forms.TextInput(attrs={'class': 'form-control', 'placeholder': ' '}),
            'email': forms.EmailInput(attrs={'class': 'form-control', 'placeholder': ' '}),
            'is_active': forms.CheckboxInput(attrs={'class': 'form-check-input'}),
        }


class UserProfileForm(forms.ModelForm):
    """Form for editing UserProfile fields."""
    class Meta:
        model = UserProfile
        fields = ['role', 'theme', 'phone', 'cnic', 'is_active']
        widgets = {
            'role': forms.Select(attrs={'class': 'form-control'}),
            'theme': forms.Select(attrs={'class': 'form-control'}),
            'phone': forms.TextInput(attrs={'class': 'form-control', 'placeholder': ' '}),
            'cnic': forms.TextInput(attrs={'class': 'form-control', 'placeholder': ' '}),
            'is_active': forms.CheckboxInput(attrs={'class': 'form-check-input'}),
        }


class CreateUserForm(forms.Form):
    username = forms.CharField(
        max_length=150,
        widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': ' '})
    )
    email = forms.EmailField(
        widget=forms.EmailInput(attrs={'class': 'form-control', 'placeholder': ' '})
    )
    password = forms.CharField(
        widget=forms.PasswordInput(attrs={'class': 'form-control', 'placeholder': ' '})
    )
    password_confirm = forms.CharField(
        widget=forms.PasswordInput(attrs={'class': 'form-control', 'placeholder': ' '})
    )
    first_name = forms.CharField(
        max_length=30,
        widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': ' '})
    )
    last_name = forms.CharField(
        max_length=30,
        widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': ' '})
    )
    role = forms.ChoiceField(
        choices=[(k, v) for k, v in UserProfile.ROLE_CHOICES if k in ['super_admin', 'admin', 'staff']],
        widget=forms.Select(attrs={'class': 'form-control'})
    )
    phone = forms.CharField(
        max_length=20,
        required=False,
        widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': ' '})
    )
    cnic = forms.CharField(
        max_length=15,
        required=False,
        widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': ' '})
    )

    def clean_password_confirm(self):
        password = self.cleaned_data.get('password')
        password_confirm = self.cleaned_data.get('password_confirm')
        if password and password_confirm and password != password_confirm:
            raise forms.ValidationError('Passwords do not match')
        return password_confirm

    def clean_username(self):
        username = self.cleaned_data.get('username')
        if User.objects.filter(username=username).exists():
            raise forms.ValidationError('Username already exists')
        return username


class UserEditForm(forms.ModelForm):
    """Form for editing an existing user and profile together."""
    role = forms.ChoiceField(
        choices=[(k, v) for k, v in UserProfile.ROLE_CHOICES if k in ['super_admin', 'admin', 'staff']],
        widget=forms.Select(attrs={'class': 'form-control'})
    )
    phone = forms.CharField(
        max_length=20, required=False,
        widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': ' '})
    )
    cnic = forms.CharField(
        max_length=15, required=False,
        widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': ' '})
    )

    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'email', 'is_active']
        widgets = {
            'first_name': forms.TextInput(attrs={'class': 'form-control', 'placeholder': ' '}),
            'last_name': forms.TextInput(attrs={'class': 'form-control', 'placeholder': ' '}),
            'email': forms.EmailInput(attrs={'class': 'form-control', 'placeholder': ' '}),
            'is_active': forms.CheckboxInput(attrs={'class': 'form-check-input'}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if self.instance and hasattr(self.instance, 'profile'):
            self.fields['role'].initial = self.instance.profile.role
            self.fields['phone'].initial = self.instance.profile.phone
            self.fields['cnic'].initial = self.instance.profile.cnic

    def save(self, commit=True):
        user = super().save(commit)
        if commit and hasattr(user, 'profile'):
            user.profile.role = self.cleaned_data['role']
            user.profile.phone = self.cleaned_data['phone']
            user.profile.cnic = self.cleaned_data['cnic']
            user.profile.save()
        return user