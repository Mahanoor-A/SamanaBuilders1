from django import forms
from django.utils import timezone
from datetime import timedelta
from .models import Booking, InstallmentPlan, Installment
from customers.models import Customer
from properties.models import Plot


class BookingForm(forms.ModelForm):
    class Meta:
        model = Booking
        fields = ['customer', 'plot', 'total_amount', 'advance_paid', 'notes']
        widgets = {
            'customer': forms.Select(attrs={'class': 'form-control'}),
            'plot': forms.Select(attrs={'class': 'form-control'}),
            'total_amount': forms.NumberInput(attrs={'class': 'form-control', 'placeholder': 'Total Amount', 'step': '0.01'}),
            'advance_paid': forms.NumberInput(attrs={'class': 'form-control', 'placeholder': 'Advance Paid', 'step': '0.01'}),
            'notes': forms.Textarea(attrs={'class': 'form-control', 'rows': 2, 'placeholder': 'Booking notes...'}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['customer'].queryset = Customer.objects.filter(is_active=True)
        self.fields['plot'].queryset = Plot.objects.filter(status='available')
        self.fields['advance_paid'].initial = 0

    def clean_total_amount(self):
        amount = self.cleaned_data.get('total_amount')
        if amount and amount <= 0:
            raise forms.ValidationError('Total amount must be greater than 0')
        return amount

    def clean_advance_paid(self):
        advance = self.cleaned_data.get('advance_paid')
        total = self.cleaned_data.get('total_amount')
        if advance and total and advance > total:
            raise forms.ValidationError('Advance cannot exceed total amount')
        if advance and advance < 0:
            raise forms.ValidationError('Advance cannot be negative')
        return advance


class InstallmentPlanForm(forms.ModelForm):
    class Meta:
        model = InstallmentPlan
        fields = ['total_installments', 'installment_amount', 'start_date', 'due_day', 'late_fee_per_day']
        widgets = {
            'total_installments': forms.NumberInput(attrs={'class': 'form-control', 'placeholder': 'Number of Installments'}),
            'installment_amount': forms.NumberInput(attrs={'class': 'form-control', 'placeholder': 'Amount per Installment', 'step': '0.01'}),
            'start_date': forms.DateInput(attrs={'class': 'form-control', 'type': 'date'}),
            'due_day': forms.NumberInput(attrs={'class': 'form-control', 'placeholder': 'Day of Month (1-31)'}),
            'late_fee_per_day': forms.NumberInput(attrs={'class': 'form-control', 'placeholder': 'Late Fee Per Day', 'step': '0.01'}),
        }

    def clean_due_day(self):
        day = self.cleaned_data.get('due_day')
        if day and (day < 1 or day > 31):
            raise forms.ValidationError('Day must be between 1 and 31')
        return day

    def clean_total_installments(self):
        count = self.cleaned_data.get('total_installments')
        if count and count <= 0:
            raise forms.ValidationError('Must have at least 1 installment')
        return count
