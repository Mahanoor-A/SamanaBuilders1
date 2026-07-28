from django.db import models
from django.contrib.auth.models import User
from bookings.models import Booking, Installment


class Payment(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('pending', 'Pending Verification'),
        ('under_clearing', 'Under Clearing'),
        ('verified', 'Verified'),
        ('rejected', 'Rejected'),
        ('bounced', 'Bounced'),
        ('reversed', 'Reversed'),
        ('partially_applied', 'Partially Applied'),
    ]
    
    METHOD_CHOICES = [
        ('cash', 'Cash'),
        ('bank_transfer', 'Bank Transfer'),
        ('cheque', 'Cheque'),
        ('online', 'Online Payment'),
        ('jazzcash', 'JazzCash'),
        ('easypaisa', 'Easypaisa'),
        ('raast', 'Raast Transfer'),
    ]
    
    payment_id = models.CharField(max_length=20, unique=True, editable=False)
    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name='payments')
    installment = models.ForeignKey(Installment, on_delete=models.SET_NULL, null=True, blank=True, related_name='payments')
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    payment_date = models.DateField()
    payment_method = models.CharField(max_length=20, choices=METHOD_CHOICES, default='cash')
    reference_number = models.CharField(max_length=100, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Cheque fields
    bank_name = models.CharField(max_length=100, blank=True)
    cheque_number = models.CharField(max_length=50, blank=True)
    cheque_date = models.DateField(null=True, blank=True)
    clearance_date = models.DateField(null=True, blank=True)
    bounce_reason = models.TextField(blank=True)
    bounce_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    unallocated_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    notes = models.TextField(blank=True)
    receipt_generated = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    verified_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='payments_verified')
    verified_at = models.DateTimeField(null=True, blank=True)
    
    def save(self, *args, **kwargs):
        if not self.payment_id:
            last_payment = Payment.objects.order_by('-id').first()
            if last_payment:
                last_num = int(last_payment.payment_id.split('-')[1])
                self.payment_id = f'PAY-{str(last_num + 1).zfill(5)}'
            else:
                self.payment_id = 'PAY-00001'
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.payment_id} - {self.booking.booking_id}"
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['payment_date']),
        ]


class PaymentAllocation(models.Model):
    payment = models.ForeignKey(Payment, on_delete=models.CASCADE, related_name='allocations')
    installment = models.ForeignKey(Installment, on_delete=models.CASCADE, related_name='allocations')
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    allocated_at = models.DateTimeField(auto_now_add=True)
    allocated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    
    class Meta:
        unique_together = ['payment', 'installment']


class Refund(models.Model):
    REASON_CHOICES = [
        ('cancellation', 'Booking Cancellation'),
        ('overpayment', 'Overpayment'),
        ('booking_transfer', 'Booking Transfer'),
        ('other', 'Other'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('processed', 'Processed'),
        ('rejected', 'Rejected'),
    ]
    
    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name='refunds')
    original_payment = models.ForeignKey(Payment, on_delete=models.SET_NULL, null=True, blank=True)
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    reason = models.CharField(max_length=30, choices=REASON_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='refunds_approved')
    processed_date = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)


class Receipt(models.Model):
    receipt_id = models.CharField(max_length=20, unique=True, editable=False)
    payment = models.ForeignKey(Payment, on_delete=models.CASCADE, related_name='receipts')
    receipt_number = models.CharField(max_length=50, blank=True)
    receipt_date = models.DateField(default=None, null=True, blank=True)
    generated_at = models.DateTimeField(auto_now_add=True)
    generated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    receipt_template = models.CharField(max_length=50, default='standard')
    pdf_file = models.FileField(upload_to='receipts/%Y/%m/', blank=True)
    is_duplicate = models.BooleanField(default=False)
    cancellation_reason = models.TextField(blank=True)
    
    def save(self, *args, **kwargs):
        if not self.receipt_id:
            last_receipt = Receipt.objects.order_by('-id').first()
            if last_receipt:
                last_num = int(last_receipt.receipt_id.split('-')[1])
                self.receipt_id = f'RCP-{str(last_num + 1).zfill(5)}'
            else:
                self.receipt_id = 'RCP-00001'
        
        if not self.receipt_number:
            from datetime import date
            today = date.today()
            receipts_today = Receipt.objects.filter(receipt_date=today).count()
            self.receipt_number = f'RCP-{today.year}-{str(today.month).zfill(2)}-{str(receipts_today + 1).zfill(5)}'
        
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.receipt_number} - {self.payment.payment_id}"
    
    class Meta:
        verbose_name_plural = 'Receipts'