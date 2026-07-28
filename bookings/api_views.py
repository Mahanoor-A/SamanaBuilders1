from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.utils import timezone
from .models import (
    Booking, BookingGroup, BookingTransfer, BookingAmendment,
    InstallmentPlan, InstallmentPlanTemplate, Installment,
    Reservation, CancellationPolicy, LateFeeConfiguration,
    PaymentReminder, EarlySettlement
)
from .serializers import (
    BookingSerializer, BookingCreateSerializer, BookingDetailSerializer,
    InstallmentPlanSerializer, InstallmentSerializer,
    InstallmentPlanTemplateSerializer, ReservationSerializer,
    BookingTransferSerializer, BookingAmendmentSerializer,
    EarlySettlementSerializer,
)


class IsStaffOrAbove(permissions.BasePermission):
    """Allow all three levels for read, only admin+ for write."""
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.method in permissions.SAFE_METHODS:
            return True
        if request.user.is_superuser:
            return True
        if hasattr(request.user, 'profile'):
            return request.user.profile.role in ['super_admin', 'admin', 'staff']
        return False
    
    def has_object_permission(self, request, view, obj):
        # Staff can view, but not delete
        if request.method == 'DELETE':
            if request.user.is_superuser:
                return True
            if hasattr(request.user, 'profile'):
                return request.user.profile.role in ['super_admin', 'admin']
            return False
        return True


class BookingViewSet(viewsets.ModelViewSet):
    queryset = Booking.objects.select_related(
        'customer', 'plot', 'plot__project', 'created_by', 'group'
    ).all()
    serializer_class = BookingSerializer
    permission_classes = [IsStaffOrAbove]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return BookingCreateSerializer
        if self.action in ['retrieve', 'detail']:
            return BookingDetailSerializer
        return BookingSerializer
    
    def perform_create(self, serializer):
        booking = serializer.save(created_by=self.request.user)
        # Update plot status
        plot = booking.plot
        plot.status = 'booked'
        plot.save()
        from core.models import AuditLog
        AuditLog.objects.create(
            user=self.request.user, action='create', model_name='Booking',
            object_id=booking.booking_id,
            description=f'Created booking {booking.booking_id} for {booking.customer.full_name} via API'
        )
    
    def get_queryset(self):
        qs = super().get_queryset()
        status_filter = self.request.query_params.get('status')
        customer_id = self.request.query_params.get('customer')
        project_id = self.request.query_params.get('project')
        
        if status_filter:
            qs = qs.filter(status=status_filter)
        if customer_id:
            qs = qs.filter(customer_id=customer_id)
        if project_id:
            qs = qs.filter(plot__project_id=project_id)
        
        return qs
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        booking = self.get_object()
        reason = request.data.get('reason', 'other')
        notes = request.data.get('notes', '')
        
        plot = booking.plot
        plot.status = 'available'
        plot.save()
        
        booking.status = 'cancelled'
        booking.notes = (booking.notes + '\n---\nCancelled: ' + notes) if booking.notes else notes
        booking.save()
        
        from core.models import AuditLog
        AuditLog.objects.create(
            user=request.user, action='cancel', model_name='Booking',
            object_id=booking.booking_id,
            description=f'Cancelled booking {booking.booking_id} - Reason: {reason}'
        )
        
        return Response(BookingSerializer(booking).data)
    
    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        booking = self.get_object()
        booking.status = 'confirmed'
        booking.save()
        
        from core.models import AuditLog
        AuditLog.objects.create(
            user=request.user, action='update', model_name='Booking',
            object_id=booking.booking_id,
            description=f'Confirmed booking {booking.booking_id}'
        )
        
        return Response(BookingSerializer(booking).data)


class InstallmentPlanViewSet(viewsets.ModelViewSet):
    queryset = InstallmentPlan.objects.prefetch_related('installments').all()
    serializer_class = InstallmentPlanSerializer
    permission_classes = [IsStaffOrAbove]
    
    def perform_create(self, serializer):
        plan = serializer.save()
        if self.request.data.get('generate_now', True):
            plan.auto_generate()


class InstallmentViewSet(viewsets.ModelViewSet):
    queryset = Installment.objects.select_related('plan__booking').all()
    serializer_class = InstallmentSerializer
    permission_classes = [IsStaffOrAbove]
    
    def get_queryset(self):
        qs = super().get_queryset()
        plan_id = self.request.query_params.get('plan')
        status_filter = self.request.query_params.get('status')
        
        if plan_id:
            qs = qs.filter(plan_id=plan_id)
        if status_filter:
            qs = qs.filter(status=status_filter)
        
        return qs
    
    @action(detail=True, methods=['post'])
    def mark_paid(self, request, pk=None):
        installment = self.get_object()
        installment.status = 'paid'
        installment.paid_date = request.data.get('paid_date', timezone.now().date())
        installment.paid_amount = request.data.get('paid_amount', installment.amount)
        installment.save()
        return Response(InstallmentSerializer(installment).data)


class InstallmentPlanTemplateViewSet(viewsets.ModelViewSet):
    queryset = InstallmentPlanTemplate.objects.all()
    serializer_class = InstallmentPlanTemplateSerializer
    permission_classes = [IsStaffOrAbove]


class ReservationViewSet(viewsets.ModelViewSet):
    queryset = Reservation.objects.select_related('customer', 'plot', 'created_by').all()
    serializer_class = ReservationSerializer
    permission_classes = [IsStaffOrAbove]
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def convert(self, request, pk=None):
        """Convert reservation to booking."""
        reservation = self.get_object()
        reservation.status = 'converted'
        reservation.save()
        return Response({'status': 'converted'}, status=status.HTTP_200_OK)


class BookingTransferViewSet(viewsets.ModelViewSet):
    queryset = BookingTransfer.objects.select_related(
        'booking', 'from_customer', 'to_customer', 'approved_by'
    ).all()
    serializer_class = BookingTransferSerializer
    permission_classes = [IsStaffOrAbove]


class EarlySettlementViewSet(viewsets.ModelViewSet):
    queryset = EarlySettlement.objects.all()
    serializer_class = EarlySettlementSerializer
    permission_classes = [IsStaffOrAbove]