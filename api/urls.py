from django.urls import path, include
from rest_framework.routers import DefaultRouter
from core.api_views import UserViewSet, AuditLogViewSet
from customers.api_views import CustomerViewSet
from properties.api_views import ProjectViewSet, PlotViewSet
from bookings.api_views import BookingViewSet, InstallmentPlanViewSet, InstallmentViewSet
from payments.api_views import PaymentViewSet, ReceiptViewSet

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'audit-logs', AuditLogViewSet)
router.register(r'customers', CustomerViewSet)
router.register(r'projects', ProjectViewSet)
router.register(r'plots', PlotViewSet)
router.register(r'bookings', BookingViewSet)
router.register(r'installment-plans', InstallmentPlanViewSet)
router.register(r'installments', InstallmentViewSet)
router.register(r'payments', PaymentViewSet)
router.register(r'receipts', ReceiptViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('auth/', include('rest_framework.urls', namespace='rest_framework')),
]
