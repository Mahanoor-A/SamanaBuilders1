from django import forms
from .models import Payment
from bookings.models import Booking, Installment


class PaymentForm(forms.ModelForm):
    class Meta:
        model = Payment
        fields = ['booking', 'installment', 'amount', 'payment_date', 'payment_method',
                  'reference_number', 'notes']
        widgets = {
            'booking': forms.Select(attrs={'class': 'form-control'}),
            'installment': forms.Select(attrs={'class': 'form-control'}),
            'amount': forms.NumberInput(attrs={'class': 'form-control', 'placeholder': 'Amount', 'step': '0.01'}),
            'payment_date': forms.DateInput(attrs={'class': 'form-control', 'type': 'date'}),
            'payment_method': forms.Select(attrs={'class': 'form-control'}),
            'reference_number': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Reference/Cheque Number'}),
            'notes': forms.Textarea(attrs={'class': 'form-control', 'rows': 2, 'placeholder': 'Payment notes...'}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['booking'].queryset = Booking.objects.filter(status__in=['pending', 'confirmed'])
        self.fields['installment'].queryset = Installment.objects.filter(status__in=['pending', 'overdue', 'partial'])
        self.fields['installment'].required = False
        self.fields['reference_number'].required = False
        self.fields['notes'].required = False

    def clean_amount(self):
        amount = self.cleaned_data.get('amount')
        if amount and amount <= 0:
            raise forms.ValidationError('Amount must be greater than 0')
        return amount


class PaymentVerificationForm(forms.Form):
    ACTION_CHOICES = [
        ('verify', 'Verify Payment'),
        ('reject', 'Reject Payment'),
    ]
    
    action = forms.ChoiceField(
        choices=ACTION_CHOICES,
        widget=forms.RadioSelect(attrs={'class': 'form-check-input'})
    )
    notes = forms.CharField(
        required=False,
        widget=forms.Textarea(attrs={'class': 'form-control', 'rows': 2, 'placeholder': 'Verification notes...'})
    )
