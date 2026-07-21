from django.contrib import admin
from .models import Booking, InstallmentPlan, Installment


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ['booking_id', 'customer', 'plot', 'total_amount', 'advance_paid', 'status', 'booking_date']
    search_fields = ['booking_id', 'customer__first_name', 'customer__last_name']
    list_filter = ['status', 'booking_date']
    readonly_fields = ['booking_id', 'created_at', 'updated_at']


@admin.register(InstallmentPlan)
class InstallmentPlanAdmin(admin.ModelAdmin):
    list_display = ['booking', 'total_installments', 'installment_amount', 'start_date', 'is_active']
    list_filter = ['is_active']


@admin.register(Installment)
class InstallmentAdmin(admin.ModelAdmin):
    list_display = ['installment_number', 'plan', 'due_date', 'amount', 'paid_amount', 'status']
    list_filter = ['status', 'due_date']
    readonly_fields = ['created_at', 'updated_at']
