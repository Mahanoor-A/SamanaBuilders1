from django.contrib import admin
from .models import Customer, CustomerLedgerEntry, ReceivableAging


@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ['customer_id', 'first_name', 'last_name', 'phone', 'cnic', 'is_active', 'created_at']
    search_fields = ['customer_id', 'first_name', 'last_name', 'phone', 'cnic']
    list_filter = ['is_active', 'city', 'created_at']
    readonly_fields = ['customer_id', 'created_at', 'updated_at']
    fieldsets = (
        ('Identification', {
            'fields': ('customer_id', 'first_name', 'last_name', 'email', 'phone', 'alternate_phone', 'cnic')
        }),
        ('Address', {
            'fields': ('address', 'city')
        }),
        ('Status', {
            'fields': ('is_active', 'notes')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(CustomerLedgerEntry)
class CustomerLedgerEntryAdmin(admin.ModelAdmin):
    list_display = ['customer', 'transaction_type', 'debit', 'credit', 'running_balance', 'entry_date']
    list_filter = ['transaction_type', 'entry_date']
    search_fields = ['customer__first_name', 'customer__last_name', 'reference_id', 'description']
    readonly_fields = ['running_balance', 'created_at']
    
    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(ReceivableAging)
class ReceivableAgingAdmin(admin.ModelAdmin):
    list_display = ['customer', 'booking', 'current_balance', 'days_overdue', 'aging_bucket', 'computed_at']
    list_filter = ['aging_bucket', 'computed_at']
    search_fields = ['customer__first_name', 'customer__last_name']
    readonly_fields = ['computed_at']
    
    def has_add_permission(self, request):
        return False
    
    def has_change_permission(self, request, obj=None):
        return False