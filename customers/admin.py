from django.contrib import admin
from .models import Customer


@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ['customer_id', 'first_name', 'last_name', 'phone', 'cnic', 'is_active', 'created_at']
    search_fields = ['customer_id', 'first_name', 'last_name', 'phone', 'cnic']
    list_filter = ['is_active', 'created_at']
    readonly_fields = ['customer_id', 'created_at', 'updated_at']
