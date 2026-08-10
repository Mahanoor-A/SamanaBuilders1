from django.contrib import admin
from .models import Expense


@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display = ('expense_date', 'project', 'amount', 'expense_type', 'paid_to', 'created_by')
    list_filter = ('expense_type', 'expense_date', 'project')
    search_fields = ('description', 'paid_to', 'project__name')
    date_hierarchy = 'expense_date'
    list_select_related = ('project', 'created_by')