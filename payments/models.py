from django.db import models
from django.contrib.auth.models import User
from bookings.models import Booking, Installment


class Payment(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending Verification'),
        ('verified', 'Verified'),
        ('rejected', 'Rejected'),
    ]
    
    METHOD_CHOICES = [
        ('cash', 'Cash'),
        ('bank_transfer', 'Bank Transfer'),
        ('cheque', 'Cheque'),
        ('online', 'Online Payment'),
    ]
    
    payment_id = models.CharField(max_length=20, unique=True, editable=False)
    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name='payments')
    installment = models.ForeignKey(Installment, on_delete=models.SET_NULL, null=True, blank=True, related_name='payments')
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    payment_date = models.DateField()
    payment_method = models.CharField(max_length=20, choices=METHOD_CHOICES, default='cash')
    reference_number = models.CharField(max_length=100, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
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


class Receipt(models.Model):
    receipt_id = models.CharField(max_length=20, unique=True, editable=False)
    payment = models.OneToOneField(Payment, on_delete=models.CASCADE, related_name='receipt')
    generated_at = models.DateTimeField(auto_now_add=True)
    generated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    pdf_file = models.FileField(upload_to='receipts/', blank=True)
    
    def save(self, *args, **kwargs):
        if not self.receipt_id:
            last_receipt = Receipt.objects.order_by('-id').first()
            if last_receipt:
                last_num = int(last_receipt.receipt_id.split('-')[1])
                self.receipt_id = f'RCP-{str(last_num + 1).zfill(5)}'
            else:
                self.receipt_id = 'RCP-00001'
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.receipt_id} - {self.payment.payment_id}"
    
    class Meta:
        verbose_name_plural = 'Receipts'
