### Task 2: Backend — Booking Payment-Summary Endpoint

**Files:**
- Modify: `bookings/api_views.py`

**Interfaces:**
- Consumes: `Booking`, `InstallmentPlan`, `Installment`, `Payment` models, existing `BookingGroup` model
- Produces: `GET /api/bookings/{id}/payment-summary/` endpoint

**Steps:**

1. Add imports to `bookings/api_views.py`:
   ```python
   from django.db.models import Sum
   from payments.models import Payment
   ```

2. Add `payment_summary` action method to `BookingViewSet` class (after the `confirm` action):
   ```python
   @action(detail=True, methods=['get'])
   def payment_summary(self, request, pk=None):
       booking = self.get_object()
       
       property_price = booking.total_amount
       
       installment_plan = getattr(booking, 'installment_plan', None)
       discount = 0
       down_payment = 0
       remaining_amount = property_price
       
       installments_data = []
       total_installments = 0
       paid_installments = 0
       installment_amount = 0
       
       if installment_plan:
           group = BookingGroup.objects.filter(bookings=booking).first()
           discount = group.discount_amount if group else 0
           down_payment = installment_plan.down_payment_amount
           remaining_amount = property_price - down_payment
           total_installments = installment_plan.total_installments
           installment_amount = installment_plan.installment_amount
           
           for inst in installment_plan.installments.all().order_by('installment_number'):
               if inst.status == 'paid':
                   paid_installments += 1
               installments_data.append({
                   'id': inst.id,
                   'installment_number': inst.installment_number,
                   'due_date': inst.due_date,
                   'amount': float(inst.amount),
                   'late_fee': float(inst.late_fee),
                   'paid_amount': float(inst.paid_amount),
                   'remaining_amount': float(inst.remaining_amount),
                   'status': inst.status,
                   'status_display': inst.get_status_display(),
               })
       
       final_price = property_price - discount
       total_paid = float(booking.advance_paid)
       outstanding = float(booking.remaining_balance)
       progress = booking.payment_progress
       
       return Response({
           'booking_id': booking.booking_id,
           'property_price': float(property_price),
           'discount': float(discount),
           'final_price': float(final_price),
           'down_payment': float(down_payment),
           'remaining_amount': float(remaining_amount),
           'total_paid': total_paid,
           'paid_installments': paid_installments,
           'total_installments': total_installments,
           'installment_amount': float(installment_amount),
           'outstanding': outstanding,
           'progress_percent': progress,
           'has_installment_plan': installment_plan is not None,
           'installment_plan': {
               'id': installment_plan.id,
               'total_installments': installment_plan.total_installments,
               'installment_amount': float(installment_plan.installment_amount),
               'down_payment_amount': float(installment_plan.down_payment_amount),
               'start_date': installment_plan.start_date,
               'frequency': installment_plan.frequency,
               'frequency_display': installment_plan.get_frequency_display(),
           } if installment_plan else None,
           'installments': installments_data,
       })
   ```

3. Run `python manage.py check` to verify.

**Report file:** `.superpowers/sdd/task-2-report.md`
