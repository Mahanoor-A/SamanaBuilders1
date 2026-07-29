from django import forms
from .models import Payment
from bookings.models import Booking, Installment


class PaymentForm(forms.ModelForm):
    payment_type = forms.ChoiceField(
        choices=[('', 'Select type...'), ('down_payment', 'Down Payment'), ('installment', 'Installment'),
                 ('advance', 'Advance'), ('final_payment', 'Final Payment'), ('late_fee', 'Late Fee'),
                 ('adjustment', 'Adjustment')],
        required=True, widget=forms.Select(attrs={'class': 'form-control'})
    )

    class Meta:
        model = Payment
        fields = ['booking', 'installment', 'amount', 'payment_date', 'payment_method', 'payment_type',
                  'reference_number', 'bank_name', 'cheque_number', 'cheque_date', 'notes', 'method_data']
        widgets = {
            'booking': forms.Select(attrs={'class': 'form-control', 'id': 'id_booking'}),
            'installment': forms.Select(attrs={'class': 'form-control'}),
            'amount': forms.NumberInput(attrs={'class': 'form-control', 'placeholder': ' ', 'step': '0.01', 'id': 'id_amount'}),
            'payment_date': forms.DateInput(attrs={'class': 'form-control', 'type': 'date', 'id': 'id_payment_date'}),
            'payment_method': forms.Select(attrs={'class': 'form-control', 'id': 'id_payment_method'}),
            'reference_number': forms.TextInput(attrs={'class': 'form-control', 'placeholder': ' '}),
            'bank_name': forms.TextInput(attrs={'class': 'form-control', 'placeholder': ' '}),
            'cheque_number': forms.TextInput(attrs={'class': 'form-control', 'placeholder': ' '}),
            'cheque_date': forms.DateInput(attrs={'class': 'form-control', 'type': 'date'}),
            'notes': forms.Textarea(attrs={'class': 'form-control', 'rows': 2, 'placeholder': ' '}),
            'method_data': forms.HiddenInput(attrs={'id': 'id_method_data'}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['booking'].queryset = Booking.objects.filter(status__in=['pending', 'confirmed', 'active'])
        self.fields['installment'].queryset = Installment.objects.filter(status__in=['pending', 'overdue', 'partial'])
        self.fields['installment'].required = False
        self.fields['reference_number'].required = False
        self.fields['notes'].required = False
        self.fields['bank_name'].required = False
        self.fields['cheque_number'].required = False
        self.fields['cheque_date'].required = False
        self.fields['method_data'].required = False

    def clean_amount(self):
        amount = self.cleaned_data.get('amount')
        if amount and amount <= 0:
            raise forms.ValidationError('Amount must be greater than 0')
        return amount

    def clean(self):
        cleaned = super().clean()
        method = cleaned.get('payment_method')
        if method == 'cheque':
            if not cleaned.get('cheque_number'):
                raise forms.ValidationError('Cheque number is required for cheque payments')
            if not cleaned.get('bank_name'):
                raise forms.ValidationError('Bank name is required for cheque payments')
        return cleaned


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


class PaymentFilterForm(forms.Form):
    STATUS_CHOICES = [
        ('', 'All Statuses'),
        ('pending', 'Pending'),
        ('verified', 'Verified'),
        ('rejected', 'Rejected'),
        ('draft', 'Draft'),
        ('bounced', 'Bounced'),
    ]
    
    status = forms.ChoiceField(choices=STATUS_CHOICES, required=False,
                               widget=forms.Select(attrs={'class': 'form-control'}))
    method = forms.ChoiceField(
        choices=[('', 'All Methods')] + list(Payment.METHOD_CHOICES),
        required=False,
        widget=forms.Select(attrs={'class': 'form-control'})
    )
    date_from = forms.DateField(required=False,
                                widget=forms.DateInput(attrs={'class': 'form-control', 'type': 'date'}))
    date_to = forms.DateField(required=False,
                              widget=forms.DateInput(attrs={'class': 'form-control', 'type': 'date'}))