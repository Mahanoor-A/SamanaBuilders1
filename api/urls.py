from django.urls import path, include
from rest_framework.routers import DefaultRouter
from core.api_views import UserViewSet, AuditLogViewSet, ProfileViewSet
from customers.api_views import CustomerViewSet, CustomerLedgerEntryViewSet
from properties.api_views import (
    ProjectViewSet, ProjectPhaseViewSet, PlotViewSet,
    PlotFeatureViewSet, PriceHistoryViewSet
)
from bookings.api_views import (
    BookingViewSet, InstallmentPlanViewSet, InstallmentViewSet,
    InstallmentPlanTemplateViewSet, ReservationViewSet,
    BookingTransferViewSet, EarlySettlementViewSet
)
from payments.api_views import (
    PaymentViewSet, ReceiptViewSet, RefundViewSet, PaymentAllocationViewSet
)

router = DefaultRouter()

# Core
router.register(r'users', UserViewSet)
router.register(r'audit-logs', AuditLogViewSet)
router.register(r'profile', ProfileViewSet, basename='profile')

# Customers
router.register(r'customers', CustomerViewSet)
router.register(r'customer-ledger', CustomerLedgerEntryViewSet)

# Properties
router.register(r'projects', ProjectViewSet)
router.register(r'project-phases', ProjectPhaseViewSet)
router.register(r'plots', PlotViewSet)
router.register(r'plot-features', PlotFeatureViewSet)
router.register(r'price-history', PriceHistoryViewSet)

# Bookings
router.register(r'bookings', BookingViewSet)
router.register(r'installment-plans', InstallmentPlanViewSet)
router.register(r'installments', InstallmentViewSet)
router.register(r'installment-plan-templates', InstallmentPlanTemplateViewSet)
router.register(r'reservations', ReservationViewSet)
router.register(r'booking-transfers', BookingTransferViewSet)
router.register(r'early-settlements', EarlySettlementViewSet)

# Payments
router.register(r'payments', PaymentViewSet)
router.register(r'receipts', ReceiptViewSet)
router.register(r'refunds', RefundViewSet)
router.register(r'payment-allocations', PaymentAllocationViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('auth/', include('rest_framework.urls', namespace='rest_framework')),
]