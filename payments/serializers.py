from rest_framework import serializers
from .models import Payment, Receipt


class ReceiptSerializer(serializers.ModelSerializer):
    class Meta:
        model = Receipt
        fields = ['id', 'receipt_id', 'payment', 'generated_at', 'generated_by']
        read_only_fields = ['id', 'receipt_id', 'generated_at', 'generated_by']


class PaymentSerializer(serializers.ModelSerializer):
    booking_id_display = serializers.CharField(source='booking.booking_id', read_only=True)
    customer_name = serializers.CharField(source='booking.customer.full_name', read_only=True)
    receipt = ReceiptSerializer(read_only=True)
    
    class Meta:
        model = Payment
        fields = ['id', 'payment_id', 'booking', 'booking_id_display', 'customer_name',
                  'installment', 'amount', 'payment_date', 'payment_method',
                  'reference_number', 'status', 'notes', 'receipt_generated', 'receipt',
                  'created_at', 'updated_at', 'created_by', 'verified_by', 'verified_at']
        read_only_fields = ['id', 'payment_id', 'created_at', 'updated_at', 'created_by',
                           'verified_by', 'verified_at', 'receipt_generated']
    
    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError('Amount must be greater than 0')
        return value


class PaymentVerificationSerializer(serializers.Serializer):
    ACTION_CHOICES = [
        ('verify', 'Verify Payment'),
        ('reject', 'Reject Payment'),
    ]
    
    action = serializers.ChoiceField(choices=ACTION_CHOICES)
    notes = serializers.CharField(required=False, allow_blank=True)
