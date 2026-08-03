from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from core import views as core_views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
    
    # Authentication
    path('', core_views.login_view, name='login'),
    path('login/', core_views.login_view, name='login'),
    path('logout/', core_views.logout_view, name='logout'),
    
    # Dashboard
    path('dashboard/', core_views.dashboard_view, name='dashboard'),
    path('dashboard/revenue-trend/', core_views.revenue_trend_view, name='revenue_trend_data'),
    
    # Customers
    path('customers/', core_views.customers_view, name='customers'),
    path('customers/create/', core_views.customer_create_view, name='customer_create'),
    path('customers/<int:pk>/', core_views.customer_detail_view, name='customer_detail'),
    path('customers/<int:pk>/edit/', core_views.customer_edit_view, name='customer_edit'),
    path('customers/<int:pk>/delete/', core_views.customer_delete_view, name='customer_delete'),
    
    # Properties
    path('properties/', core_views.properties_view, name='properties'),
    path('properties/project/create/', core_views.project_create_view, name='project_create'),
    path('properties/project/<int:pk>/edit/', core_views.project_edit_view, name='project_edit'),
    path('properties/project/<int:pk>/delete/', core_views.project_delete_view, name='project_delete'),
    path('properties/plot/create/', core_views.plot_create_view, name='plot_create'),
    path('properties/reserve/', core_views.reservation_create_view, name='reservation_create'),
    path('properties/plot/<int:pk>/edit/', core_views.plot_edit_view, name='plot_edit'),
    path('properties/plot/<int:pk>/delete/', core_views.plot_delete_view, name='plot_delete'),
    
    # Bookings
    path('bookings/', core_views.bookings_view, name='bookings'),
    path('bookings/create/', core_views.booking_create_view, name='booking_create'),
    path('bookings/<int:pk>/', core_views.booking_detail_view, name='booking_detail'),
    path('bookings/<int:pk>/edit/', core_views.booking_edit_view, name='booking_edit'),
    path('bookings/<int:pk>/delete/', core_views.booking_delete_view, name='booking_delete'),
    
    path('bookings/<int:pk>/transfer/', core_views.booking_transfer_view, name='booking_transfer'),

    # Payments
    path('payments/', core_views.payments_view, name='payments'),
    path('payments/create/', core_views.payment_create_view, name='payment_create'),
    path('payments/<int:pk>/', core_views.payment_detail_view, name='payment_detail'),
    
    # Receipts
    path('receipts/<int:pk>/', core_views.receipt_detail_view, name='receipt_detail'),
    
    # Users & Admin
    path('users/', core_views.users_view, name='users'),
    path('users/create/', core_views.user_create_view, name='user_create'),
    path('users/<int:pk>/edit/', core_views.user_edit_view, name='user_edit'),
    path('users/<int:pk>/role/', core_views.user_role_update_view, name='user_role_update'),
    path('users/<int:pk>/toggle-active/', core_views.user_deactivate_view, name='user_deactivate'),
    path('audit-logs/', core_views.audit_logs_view, name='audit_logs'),

    # Backup
    path('backup/', core_views.backup_view, name='backup'),
    path('backup/download/', core_views.backup_download_view, name='backup_download'),
    
    # Profile
    path('profile/', core_views.profile_view, name='profile'),
    path('api/save-theme/', core_views.save_theme_view, name='save_theme'),
]

urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)