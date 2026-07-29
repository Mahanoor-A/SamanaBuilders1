### Task 1: Backend — PaymentAttachment Model + payment_type Field

**Files:**
- Modify: `payments/models.py`
- Modify: `payments/serializers.py`

**Interfaces:**
- Consumes: existing `Payment`, `User` models
- Produces: `PaymentAttachment` model, `payment_type` field on Payment, `PaymentAttachmentSerializer`

**Steps:**
1. Add `PAYMENT_TYPE_CHOICES` and `payment_type` field to Payment model (before `save()`):
   ```python
   PAYMENT_TYPE_CHOICES = [
       ('down_payment', 'Down Payment'),
       ('installment', 'Installment'),
       ('full_payment', 'Full Payment'),
       ('other', 'Other'),
   ]
   payment_type = models.CharField(max_length=20, choices=PAYMENT_TYPE_CHOICES, default='other')
   ```

2. Add `PaymentAttachment` model at end of file (after Receipt model):
   ```python
   class PaymentAttachment(models.Model):
       ATTACHMENT_TYPES = [
           ('cheque_image', 'Cheque Image'),
           ('payment_screenshot', 'Payment Screenshot'),
           ('receipt_image', 'Receipt Image'),
           ('other', 'Other'),
       ]
       payment = models.ForeignKey(Payment, on_delete=models.CASCADE, related_name='attachments')
       file = models.FileField(upload_to='payments/%Y/%m/')
       attachment_type = models.CharField(max_length=30, choices=ATTACHMENT_TYPES)
       filename = models.CharField(max_length=255)
       uploaded_at = models.DateTimeField(auto_now_add=True)
       uploaded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
       
       def __str__(self):
           return f"{self.filename} - {self.payment.payment_id}"
   ```

3. Create and run migrations:
   ```bash
   python manage.py makemigrations payments
   python manage.py migrate payments
   ```

4. Add `PaymentAttachmentSerializer` to `payments/serializers.py` (after imports):
   ```python
   class PaymentAttachmentSerializer(serializers.ModelSerializer):
       uploaded_by_name = serializers.CharField(source='uploaded_by.username', read_only=True, allow_null=True)
       file_url = serializers.SerializerMethodField()
       
       class Meta:
           model = PaymentAttachment
           fields = ['id', 'payment', 'file', 'file_url', 'attachment_type', 'filename', 'uploaded_at', 'uploaded_by', 'uploaded_by_name']
           read_only_fields = ['id', 'uploaded_at', 'uploaded_by']
       
       def get_file_url(self, obj):
           request = self.context.get('request')
           if obj.file and request:
               return request.build_absolute_uri(obj.file.url)
           return None
   ```

5. Update `PaymentSerializer` in `serializers.py`:
   - Add `payment_type_display = serializers.CharField(source='get_payment_type_display', read_only=True)` field
   - Add `'payment_type', 'payment_type_display'` to Meta.fields after `'payment_method_display'`
   - Add `'attachments'` to Meta.fields before `'created_at'`

6. Update `PaymentCreateSerializer` Meta.fields: add `'payment_type'` after `'payment_method'`

7. Update `PaymentDetailSerializer` similarly:
   - Add `payment_type_display` field
   - Add `attachments = PaymentAttachmentSerializer(many=True, read_only=True)` field
   - Add `'payment_type', 'payment_type_display'` and `'attachments'` to Meta.fields

8. Run `python manage.py check` to verify

**Report file:** `.superpowers/sdd/task-1-report.md`
Write your report there: which files were changed, what commands were run, test results, and any concerns.
