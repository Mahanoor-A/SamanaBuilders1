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
        fields = ['role', 'theme', 'is_active']
        widgets = {
            'role': forms.Select(attrs={'class': 'form-control'}),
            'theme': forms.Select(attrs={'class': 'form-control'}),
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
        choices=UserProfile.ROLE_CHOICES,
        help_text='Super Admin accounts cannot be created from here.',
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

    def __init__(self, *args, **kwargs):
        self.actor = kwargs.pop('actor', None)
        super().__init__(*args, **kwargs)

    def clean_role(self):
        role = self.cleaned_data.get('role')
        if role == 'super_admin':
            actor_is_super_admin = bool(
                self.actor and (self.actor.is_superuser or getattr(getattr(self.actor, 'profile', None), 'role', None) == 'super_admin')
            )
            if actor_is_super_admin:
                raise forms.ValidationError('A Super Admin cannot create another Super Admin account.')
            raise forms.ValidationError('Super Admin accounts cannot be created from here.')
        return role

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
    """Form for editing an existing user, profile and password together."""
    role = forms.ChoiceField(
        choices=[(k, v) for k, v in UserProfile.ROLE_CHOICES if k != 'super_admin'],
        widget=forms.Select(attrs={'class': 'form-control'})
    )
    new_password = forms.CharField(
        label='New Password', required=False,
        widget=forms.PasswordInput(attrs={'class': 'form-control', 'placeholder': ' '})
    )
    confirm_password = forms.CharField(
        label='Confirm New Password', required=False,
        widget=forms.PasswordInput(attrs={'class': 'form-control', 'placeholder': ' '})
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
        profile = getattr(self.instance, 'profile', None)
        if profile:
            # Existing super admin roles stay visible so they can be viewed/edited.
            if profile.role == 'super_admin':
                self.fields['role'].choices = UserProfile.ROLE_CHOICES
            self.fields['role'].initial = profile.role
            self.fields['phone'].initial = profile.phone
            self.fields['cnic'].initial = profile.cnic

    def clean(self):
        cleaned = super().clean()
        p1 = cleaned.get('new_password')
        p2 = cleaned.get('confirm_password')
        if p1 or p2:
            if p1 != p2:
                raise forms.ValidationError('Passwords do not match.')
            if len(p1) < 8:
                raise forms.ValidationError('Password must be at least 8 characters.')
        return cleaned

    def save(self, commit=True):
        user = super().save(commit)
        password = self.cleaned_data.get('new_password')
        if password:
            user.set_password(password)
            if commit:
                user.save()
        if commit and hasattr(user, 'profile'):
            user.profile.role = self.cleaned_data['role']
            user.profile.phone = self.cleaned_data['phone']
            user.profile.cnic = self.cleaned_data['cnic']
            user.profile.save()
        return user