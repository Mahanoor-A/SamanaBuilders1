from django.contrib import admin
from .models import Payment, Receipt


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ['payment_id', 'booking', 'amount', 'payment_date', 'payment_method', 'status']
    search_fields = ['payment_id', 'booking__booking_id']
    list_filter = ['status', 'payment_method', 'payment_date']
    readonly_fields = ['payment_id', 'created_at', 'updated_at']


@admin.register(Receipt)
class ReceiptAdmin(admin.ModelAdmin):
    list_display = ['receipt_id', 'payment', 'generated_at']
    readonly_fields = ['receipt_id', 'generated_at']
