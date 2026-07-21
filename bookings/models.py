from django.db import models
from django.contrib.auth.models import User
from customers.models import Customer
from properties.models import Plot


class Booking(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('cancelled', 'Cancelled'),
        ('completed', 'Completed'),
    ]
    
    booking_id = models.CharField(max_length=20, unique=True, editable=False)
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='bookings')
    plot = models.ForeignKey(Plot, on_delete=models.CASCADE, related_name='bookings')
    booking_date = models.DateField(auto_now_add=True)
    total_amount = models.DecimalField(max_digits=15, decimal_places=2)
    advance_paid = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    
    def save(self, *args, **kwargs):
        if not self.booking_id:
            last_booking = Booking.objects.order_by('-id').first()
            if last_booking:
                last_num = int(last_booking.booking_id.split('-')[1])
                self.booking_id = f'BKG-{str(last_num + 1).zfill(5)}'
            else:
                self.booking_id = 'BKG-00001'
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.booking_id} - {self.customer.full_name}"
    
    @property
    def remaining_balance(self):
        return self.total_amount - self.advance_paid
    
    class Meta:
        ordering = ['-created_at']


class InstallmentPlan(models.Model):
    booking = models.OneToOneField(Booking, on_delete=models.CASCADE, related_name='installment_plan')
    total_installments = models.PositiveIntegerField(default=12)
    installment_amount = models.DecimalField(max_digits=15, decimal_places=2)
    start_date = models.DateField()
    due_day = models.PositiveIntegerField(default=1, help_text="Day of month for due date")
    late_fee_per_day = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Plan for {self.booking.booking_id} - {self.total_installments} installments"
    
    class Meta:
        verbose_name_plural = 'Installment Plans'


class Installment(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('paid', 'Paid'),
        ('overdue', 'Overdue'),
        ('partial', 'Partial'),
    ]
    
    plan = models.ForeignKey(InstallmentPlan, on_delete=models.CASCADE, related_name='installments')
    installment_number = models.PositiveIntegerField()
    due_date = models.DateField()
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    late_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    paid_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    paid_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Installment {self.installment_number} - {self.plan.booking.booking_id}"
    
    @property
    def remaining_amount(self):
        return (self.amount + self.late_fee) - self.paid_amount
    
    class Meta:
        ordering = ['due_date']
        unique_together = ['plan', 'installment_number']
