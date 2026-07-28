from django.contrib import admin
from .models import (
    Booking, BookingGroup, BookingTransfer, BookingAmendment,
    InstallmentPlan, InstallmentPlanTemplate, Installment,
    Reservation, CancellationPolicy, CancellationTier,
    LateFeeConfiguration, PaymentReminder, EarlySettlement
)


class InstallmentInline(admin.TabularInline):
    model = Installment
    extra = 0
    fields = ['installment_number', 'due_date', 'amount', 'late_fee', 'paid_amount', 'status']
    readonly_fields = ['installment_number', 'due_date', 'amount']
    can_delete = False
    
    def has_add_permission(self, request, obj=None):
        return False


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ['booking_id', 'customer', 'plot', 'total_amount', 'advance_paid', 'status', 'booking_date']
    search_fields = ['booking_id', 'customer__first_name', 'customer__last_name', 'customer__phone',
                     'plot__plot_number']
    list_filter = ['status', 'source', 'booking_date']
    readonly_fields = ['booking_id', 'created_at', 'updated_at']
    fieldsets = (
        ('Booking Info', {
            'fields': ('booking_id', 'customer', 'plot', 'group', 'source', 'status')
        }),
        ('Financial', {
            'fields': ('total_amount', 'advance_paid', 'cancellation_fee')
        }),
        ('Possession', {
            'fields': ('possession_date', 'is_possession_taken', 'cancellation_policy')
        }),
        ('Notes', {
            'fields': ('notes',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(BookingGroup)
class BookingGroupAdmin(admin.ModelAdmin):
    list_display = ['group_id', 'customer', 'total_amount', 'discount_amount', 'created_at']
    search_fields = ['group_id', 'customer__first_name', 'customer__last_name']
    readonly_fields = ['group_id', 'created_at']


@admin.register(BookingTransfer)
class BookingTransferAdmin(admin.ModelAdmin):
    list_display = ['booking', 'from_customer', 'to_customer', 'transfer_fee', 'transfer_date']
    search_fields = ['booking__booking_id', 'from_customer__first_name', 'to_customer__first_name']
    readonly_fields = ['transfer_date']


@admin.register(BookingAmendment)
class BookingAmendmentAdmin(admin.ModelAdmin):
    list_display = ['booking', 'field_name', 'old_value', 'new_value', 'changed_by', 'changed_at']
    list_filter = ['field_name', 'changed_at']
    search_fields = ['booking__booking_id', 'field_name']
    readonly_fields = ['changed_at']
    
    def has_add_permission(self, request):
        return False
    
    def has_change_permission(self, request, obj=None):
        return False


@admin.register(InstallmentPlan)
class InstallmentPlanAdmin(admin.ModelAdmin):
    list_display = ['booking', 'total_installments', 'installment_amount', 'down_payment_amount',
                   'frequency', 'start_date', 'is_active']
    list_filter = ['is_active', 'frequency']
    inlines = [InstallmentInline]


@admin.register(InstallmentPlanTemplate)
class InstallmentPlanTemplateAdmin(admin.ModelAdmin):
    list_display = ['name', 'project', 'total_installments', 'frequency', 'is_active']
    list_filter = ['project', 'is_active', 'frequency']
    search_fields = ['name', 'project__name']


@admin.register(Installment)
class InstallmentAdmin(admin.ModelAdmin):
    list_display = ['installment_number', 'plan', 'due_date', 'amount', 'late_fee', 'paid_amount', 'status']
    list_filter = ['status', 'due_date']
    search_fields = ['plan__booking__booking_id']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Reservation)
class ReservationAdmin(admin.ModelAdmin):
    list_display = ['customer', 'plot', 'token_amount', 'reserved_at', 'expires_at', 'status']
    list_filter = ['status', 'reserved_at']
    search_fields = ['customer__first_name', 'customer__last_name', 'plot__plot_number']
    readonly_fields = ['reserved_at']


@admin.register(CancellationPolicy)
class CancellationPolicyAdmin(admin.ModelAdmin):
    list_display = ['name', 'is_active', 'created_at']
    list_filter = ['is_active']


@admin.register(PaymentReminder)
class PaymentReminderAdmin(admin.ModelAdmin):
    list_display = ['installment', 'reminder_type', 'sent_at', 'sent_via', 'delivery_status']
    list_filter = ['reminder_type', 'sent_via', 'delivery_status']
    readonly_fields = ['sent_at']
    
    def has_add_permission(self, request):
        return False
    
    def has_change_permission(self, request, obj=None):
        return False


@admin.register(EarlySettlement)
class EarlySettlementAdmin(admin.ModelAdmin):
    list_display = ['plan', 'remaining_installments', 'total_remaining_amount',
                   'discount_amount', 'settlement_amount', 'approved', 'settled_at']
    list_filter = ['approved']


@admin.register(CancellationTier)
class CancellationTierAdmin(admin.ModelAdmin):
    list_display = ['policy', 'from_days', 'to_days', 'refund_percentage']
    list_filter = ['policy']


@admin.register(LateFeeConfiguration)
class LateFeeConfigurationAdmin(admin.ModelAdmin):
    list_display = ['plan', 'calculation_method', 'rate', 'waiver_allowed']
    list_filter = ['calculation_method', 'waiver_allowed']