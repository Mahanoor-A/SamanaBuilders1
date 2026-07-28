from rest_framework import serializers
from .models import Payment, Receipt, Refund, PaymentAllocation


# ─── RECEIPTS ────────────────────────────────────────────────────────────────────

class ReceiptSerializer(serializers.ModelSerializer):
    generated_by_name = serializers.CharField(source='generated_by.username', read_only=True, allow_null=True)
    
    class Meta:
        model = Receipt
        fields = ['id', 'receipt_id', 'receipt_number', 'payment', 'receipt_date',
                  'generated_at', 'generated_by', 'generated_by_name',
                  'receipt_template', 'is_duplicate', 'cancellation_reason']
        read_only_fields = ['id', 'receipt_id', 'receipt_number', 'generated_at', 'generated_by']


# ─── PAYMENT ALLOCATIONS ─────────────────────────────────────────────────────────

class PaymentAllocationSerializer(serializers.ModelSerializer):
    allocated_by_name = serializers.CharField(source='allocated_by.username', read_only=True, allow_null=True)
    
    class Meta:
        model = PaymentAllocation
        fields = ['id', 'payment', 'installment', 'amount', 'allocated_at', 'allocated_by', 'allocated_by_name']
        read_only_fields = ['id', 'allocated_at', 'allocated_by']


# ─── REFUNDS ─────────────────────────────────────────────────────────────────────

class RefundSerializer(serializers.ModelSerializer):
    booking_id_display = serializers.CharField(source='booking.booking_id', read_only=True)
    approved_by_name = serializers.CharField(source='approved_by.username', read_only=True, allow_null=True)
    reason_display = serializers.CharField(source='get_reason_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Refund
        fields = ['id', 'booking', 'booking_id_display', 'original_payment',
                  'amount', 'reason', 'reason_display', 'status', 'status_display',
                  'approved_by', 'approved_by_name', 'processed_date', 'notes', 'created_at']
        read_only_fields = ['id', 'processed_date', 'created_at']


# ─── PAYMENTS ────────────────────────────────────────────────────────────────────

class PaymentSerializer(serializers.ModelSerializer):
    booking_id_display = serializers.CharField(source='booking.booking_id', read_only=True)
    customer_name = serializers.CharField(source='booking.customer.full_name', read_only=True)
    payment_method_display = serializers.CharField(source='get_payment_method_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    created_by_name = serializers.CharField(source='created_by.username', read_only=True, allow_null=True)
    verified_by_name = serializers.CharField(source='verified_by.username', read_only=True, allow_null=True)
    
    class Meta:
        model = Payment
        fields = ['id', 'payment_id', 'booking', 'booking_id_display', 'customer_name',
                  'installment', 'amount', 'payment_date', 'payment_method',
                  'payment_method_display', 'reference_number', 'bank_name',
                  'cheque_number', 'cheque_date', 'status', 'status_display',
                  'bounce_reason', 'bounce_fee', 'unallocated_amount',
                  'receipt_generated', 'notes',
                  'created_at', 'updated_at', 'created_by', 'created_by_name',
                  'verified_by', 'verified_by_name', 'verified_at']
        read_only_fields = ['id', 'payment_id', 'created_at', 'updated_at',
                           'created_by', 'verified_by', 'verified_at', 'receipt_generated']
    
    def validate_amount(self, value):
        if value and value <= 0:
            raise serializers.ValidationError('Amount must be greater than 0')
        return value


class PaymentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = ['booking', 'installment', 'amount', 'payment_date', 'payment_method',
                  'reference_number', 'bank_name', 'cheque_number', 'cheque_date', 'notes']
    
    def validate_amount(self, value):
        if value and value <= 0:
            raise serializers.ValidationError('Amount must be greater than 0')
        return value
    
    def validate(self, data):
        if data.get('payment_method') == 'cheque':
            if not data.get('cheque_number'):
                raise serializers.ValidationError({'cheque_number': 'Cheque number is required for cheque payments'})
            if not data.get('bank_name'):
                raise serializers.ValidationError({'bank_name': 'Bank name is required for cheque payments'})
        return data


class PaymentDetailSerializer(serializers.ModelSerializer):
    """Full payment detail with receipts and allocations."""
    booking_id_display = serializers.CharField(source='booking.booking_id', read_only=True)
    customer_name = serializers.CharField(source='booking.customer.full_name', read_only=True)
    payment_method_display = serializers.CharField(source='get_payment_method_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    created_by_name = serializers.CharField(source='created_by.username', read_only=True, allow_null=True)
    verified_by_name = serializers.CharField(source='verified_by.username', read_only=True, allow_null=True)
    receipts = ReceiptSerializer(many=True, read_only=True)
    allocations = PaymentAllocationSerializer(many=True, read_only=True)
    
    class Meta:
        model = Payment
        fields = ['id', 'payment_id', 'booking', 'booking_id_display', 'customer_name',
                  'installment', 'amount', 'payment_date', 'payment_method',
                  'payment_method_display', 'reference_number', 'bank_name',
                  'cheque_number', 'cheque_date', 'clearance_date',
                  'status', 'status_display',
                  'bounce_reason', 'bounce_fee', 'unallocated_amount',
                  'receipt_generated', 'notes',
                  'receipts', 'allocations',
                  'created_at', 'updated_at', 'created_by', 'created_by_name',
                  'verified_by', 'verified_by_name', 'verified_at']
        read_only_fields = ['id', 'payment_id', 'created_at', 'updated_at',
                           'created_by', 'verified_by', 'verified_at', 'receipt_generated']


class PaymentVerificationSerializer(serializers.Serializer):
    ACTION_CHOICES = [
        ('verify', 'Verify Payment'),
        ('reject', 'Reject Payment'),
    ]
    
    action = serializers.ChoiceField(choices=ACTION_CHOICES)
    notes = serializers.CharField(required=False, allow_blank=True)