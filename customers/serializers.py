from rest_framework import serializers
from .models import Customer


class CustomerSerializer(serializers.ModelSerializer):
    full_name = serializers.ReadOnlyField()
    
    class Meta:
        model = Customer
        fields = ['id', 'customer_id', 'first_name', 'last_name', 'full_name', 'email',
                  'phone', 'alternate_phone', 'cnic', 'address', 'city', 'notes',
                  'is_active', 'created_at', 'updated_at', 'created_by']
        read_only_fields = ['id', 'customer_id', 'created_at', 'updated_at', 'created_by']
    
    def validate_cnic(self, value):
        import re
        pattern = r'^\d{5}-\d{7}-\d{1}$'
        if not re.match(pattern, value):
            raise serializers.ValidationError('CNIC format must be XXXXX-XXXXXXX-X')
        return value
    
    def validate_phone(self, value):
        import re
        pattern = r'^\+?[\d\-]{10,15}$'
        if not re.match(pattern, value):
            raise serializers.ValidationError('Enter a valid phone number (10-15 digits)')
        return value
