from rest_framework import serializers
from .models import Booking, InstallmentPlan, Installment


class InstallmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Installment
        fields = ['id', 'installment_number', 'due_date', 'amount', 'late_fee',
                  'paid_amount', 'status', 'paid_date', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class InstallmentPlanSerializer(serializers.ModelSerializer):
    installments = InstallmentSerializer(many=True, read_only=True)
    
    class Meta:
        model = InstallmentPlan
        fields = ['id', 'booking', 'total_installments', 'installment_amount',
                  'start_date', 'due_day', 'late_fee_per_day', 'is_active',
                  'installments', 'created_at']
        read_only_fields = ['id', 'created_at']


class BookingSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.full_name', read_only=True)
    plot_number = serializers.CharField(source='plot.plot_number', read_only=True)
    project_name = serializers.CharField(source='plot.project.name', read_only=True)
    remaining_balance = serializers.ReadOnlyField()
    installment_plan = InstallmentPlanSerializer(read_only=True)
    
    class Meta:
        model = Booking
        fields = ['id', 'booking_id', 'customer', 'customer_name', 'plot', 'plot_number',
                  'project_name', 'booking_date', 'total_amount', 'advance_paid',
                  'remaining_balance', 'status', 'notes', 'installment_plan',
                  'created_at', 'updated_at', 'created_by']
        read_only_fields = ['id', 'booking_id', 'booking_date', 'created_at', 'updated_at', 'created_by']
    
    def validate_total_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError('Total amount must be greater than 0')
        return value
    
    def validate_advance_paid(self, value):
        if value < 0:
            raise serializers.ValidationError('Advance cannot be negative')
        return value
