from django.urls import path
from . import views

urlpatterns = [
    path('notifications/', views.notifications_view, name='notifications'),
    path('notifications/send/', views.send_manual_notification, name='send_notification'),
]
