from django.contrib import admin
from .models import NotificationLog, NotificationPreference


@admin.register(NotificationLog)
class NotificationLogAdmin(admin.ModelAdmin):
    list_display = ['recipient_name', 'channel', 'notification_type', 'status', 'sent_at', 'created_at']
    list_filter = ['channel', 'notification_type', 'status']
    search_fields = ['recipient_name', 'recipient_contact', 'message']


@admin.register(NotificationPreference)
class NotificationPreferenceAdmin(admin.ModelAdmin):
    list_display = ['user', 'email_enabled', 'sms_enabled', 'whatsapp_enabled']
