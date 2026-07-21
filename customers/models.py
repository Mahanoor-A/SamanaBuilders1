from django.db import models
from django.contrib.auth.models import User


class Customer(models.Model):
    customer_id = models.CharField(max_length=20, unique=True, editable=False)
    user = models.OneToOneField(User, on_delete=models.SET_NULL, null=True, blank=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField(unique=True, blank=True, null=True)
    phone = models.CharField(max_length=20)
    alternate_phone = models.CharField(max_length=20, blank=True)
    cnic = models.CharField(max_length=15, unique=True)
    address = models.TextField(blank=True)
    city = models.CharField(max_length=100, blank=True)
    notes = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='customers_created')
    
    def save(self, *args, **kwargs):
        if not self.customer_id:
            last_customer = Customer.objects.order_by('-id').first()
            if last_customer:
                last_num = int(last_customer.customer_id.split('-')[1])
                self.customer_id = f'CUS-{str(last_num + 1).zfill(5)}'
            else:
                self.customer_id = 'CUS-00001'
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.customer_id} - {self.first_name} {self.last_name}"
    
    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"
    
    class Meta:
        ordering = ['-created_at']
