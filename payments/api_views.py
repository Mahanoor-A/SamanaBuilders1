from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .models import Payment, Receipt
from .serializers import PaymentSerializer, PaymentVerificationSerializer, ReceiptSerializer


class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.select_related('booking', 'booking__customer').all()
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def verify(self, request, pk=None):
        payment = self.get_object()
        serializer = PaymentVerificationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        action_type = serializer.validated_data['action']
        notes = serializer.validated_data.get('notes', '')
        
        if action_type == 'verify':
            payment.status = 'verified'
            payment.verified_by = request.user
            payment.verified_at = timezone.now()
            payment.notes = notes
            
            # Update installment if linked
            if payment.installment:
                installment = payment.installment
                installment.paid_amount += payment.amount
                if installment.paid_amount >= installment.amount:
                    installment.status = 'paid'
                    installment.paid_date = payment.payment_date
                else:
                    installment.status = 'partial'
                installment.save()
            
            # Update booking advance
            booking = payment.booking
            booking.advance_paid += payment.amount
            booking.save()
        else:
            payment.status = 'rejected'
            payment.verified_by = request.user
            payment.verified_at = timezone.now()
            payment.notes = notes
        
        payment.save()
        
        return Response(PaymentSerializer(payment).data)


class ReceiptViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Receipt.objects.all()
    serializer_class = ReceiptSerializer
    permission_classes = [permissions.IsAuthenticated]
