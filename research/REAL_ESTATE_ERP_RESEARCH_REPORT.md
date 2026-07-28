# Real Estate ERP — Comprehensive Research Report
## Samana Builders — Django Backend Best Practices

**Date:** July 27, 2026  
**Context:** Pakistani real estate developer ERP with Django + DRF + React  
**Current apps:** core, customers, properties, bookings, payments  

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Research Sources Consulted](#2-research-sources-consulted)
3. [Payment Workflows](#3-payment-workflows)
4. [Booking & Reservation Workflows](#4-booking--reservation-workflows)
5. [Property Inventory & Status Tracking](#5-property-inventory--status-tracking)
6. [Installment Plans](#6-installment-plans)
7. [Customer Ledger & Running Balance](#7-customer-ledger--running-balance)
8. [Role-Based Access & Approval Chains](#8-role-based-access--approval-chains)
9. [Data Model Recommendations](#9-data-model-recommendations)
10. [Implementation Roadmap](#10-implementation-roadmap)
11. [Appendix: Workflow Diagrams (ASCII)](#11-appendix-workflow-diagrams)

---

## 1. Executive Summary

After researching open-source Django real estate ERPs (Estate-Web, kc_realestate, CRM-Real-Estate-Django, Django-real-estate-ERP), ERPNext's project management patterns, Wikipedia's real estate software domain, Odoo's real estate module approach, and Pakistani-specific real estate practices, we have identified **seven critical areas** where the current Samana Builders ERP foundation needs enhancement:

| Area | Current State | Recommended Enhancement |
|------|--------------|----------------------|
| Payment Workflow | Basic pending→verified/rejected | Add multi-step verification, partial allocations, bank reconciliation, receipt auto-generation, settlement accounts |
| Booking Lifecycle | 4-status model (pending/confirmed/cancelled/completed) | Add reservation/holding period, booking transfer, ledger entries, cancellation policy engine, refund workflow |
| Property Inventory | 5-status model (available/reserved/booked/sold/cancelled) | Add price history, holding deposits, block booking, phase releases, inventory holds with expiry |
| Installment Plans | Basic auto-generation with late fees | Add grace periods, rescheduling, prepayment discounts, multiple late-fee tiers, automated reminders |
| Customer Ledger | Calculated property on booking.remaining_balance | Add proper double-entry ledger, running balance, transaction history, aging reports, payment allocations |
| Approval Chains | None (simple role decorators) | Add configurable approval workflows per role, payment verification tiers, cancellation workflows |
| Reporting & Analytics | Missing | Add installment schedules, overdue reports, payment projections, sales pipeline, revenue forecasting |

---

## 2. Research Sources Consulted

### Open-Source Django Projects

| Project | Stars | Key Features Relevant |
|---------|-------|----------------------|
| **Estate-Web** (Abol-khls/Estate-Web) | ⭐4 | Django REST + React, Multi-tenant agency model, Property/Visit/Contract management, Role-based architecture |
| **kc_realestate** (Nschennum/kc_realestate) | ⭐7 | Django CRM, Property management, Customer management |
| **CRM-Real-Estate-Django** (Krishnaprakkash) | ⭐0 | Role-Based Access, Approval Processes, Inventory Management |
| **Django-real-estate-ERP** (jraphaelsst) | ⭐0 | Full-stack ERP approach using Django |
| **Admiral-ERP** (programmingwithprankur) | ⭐0 | ERP focused on real estate businesses |

### Industry References

- **Wikipedia — Real Estate Investment Software**: Property management, lease management, accounting, portfolio analysis categories
- **ERPNext Documentation — Project Management**: Task-driven project structure, milestone tracking, task assignments
- **Odoo Real Estate App**: Property listings, property management, lease/rent workflows, contract handling

### Pakistani Market Context

Key findings for Pakistani real estate market:
- Installment-based property buying is the dominant purchasing model (90%+ transactions)
- CNIC-based identity verification (13-digit format: XXXXX-XXXXXXX-X)
- Common payment methods: Cash, Bank Transfer, Cheque (which may bounce → needs clearing workflow), Online Payment via 1Link/Raast
- Projects often sold in phases with staggered delivery timelines
- Plot sizes measured in Marla (1 Marla ≈ 272.25 sq ft) and Kanal (1 Kanal = 20 Marla)
- Late payment penalties are a major revenue and compliance concern
- Booking cancellation/transfer policies vary by developer and need configuration
- Digital payment adoption is growing (Raast instant transfers, JazzCash, Easypaisa)

---

## 3. Payment Workflows

### 3.1 Current State Analysis

The existing `Payments` app has:
- Payment model with statuses: `pending` → `verified` | `rejected`
- Payment methods: cash, bank_transfer, cheque, online
- A `PaymentVerificationSerializer` handling verify/reject actions
- On-verify logic: updates installment paid_amount, booking advance_paid
- Receipt model with PDF generation marker

**Gaps identified:**
- No support for partial payment allocations across multiple installments
- No cheque clearing workflow (pending verification → under clearing → cleared/bounced)
- No bank reconciliation support
- No refund processing workflow
- No payment settlement/matching against invoices
- No receipt numbering sequence (receipts use auto-generated IDs but no template)
- No payment reminders or overdue notifications

### 3.2 Recommended Payment Workflow

```
                    ┌─────────────┐
                    │  Payment    │
                    │  Created    │
                    └──────┬──────┘
                           │
                           ▼
                    ┌─────────────┐
                    │   Pending   │
                    │ Verification │
                    └──────┬──────┘
                           │
                  ┌────────┴────────┐
                  ▼                 ▼
           ┌──────────┐    ┌──────────┐
           │ Under    │    │ Returned │
           │ Clearing │    │ for Info │
           └────┬─────┘    └────┬─────┘
                │               │
         ┌──────┴──────┐       │ (re-enter)
         ▼             ▼       │
   ┌────────┐   ┌────────┐     │
   │Cleared │   │Bounced │     │
   └───┬────┘   └───┬────┘     │
       │            │          │
       ▼            ▼          │
   ┌──────────┐  ┌────────┐    │
   │ Verified │  │Rejected│    │
   │          │  │        │    │
   └──────────┘  └────────┘    │
       │                       │
       ▼                       │
   ┌──────────────┐            │
   │Receipt Auto  │            │
   │Generated     │            │
   └──────────────┘            │
       │                       │
       ▼                       │
   Allocate to Installment(s)  │
   Update Customer Ledger      │
                               │
         ◄─────────────────────┘
```

### 3.3 Concrete Feature Recommendations

**Feature 1: Multi-Stage Payment Verification**

```python
PAYMENT_STATUS_CHOICES = [
    ('draft', 'Draft'),              # Entered by sales staff
    ('pending', 'Pending Verification'),  # Submitted for accounts
    ('under_clearing', 'Under Clearing'), # Cheque/bank transfer processing
    ('verified', 'Verified'),         # Confirmed by accounts
    ('rejected', 'Rejected'),         # Rejected with reason
    ('bounced', 'Bounced'),           # Cheque bounced
    ('reversed', 'Reversed'),         # Payment reversed/refunded
    ('partially_applied', 'Partially Applied'),  # Partially allocated
    ('fully_applied', 'Fully Applied'),  # Fully allocated
]
```

**Feature 2: Cheque Clearing Workflow**

- Add `clearance_date` field for predicted cheque clearance
- Add `bounce_reason` and `bounce_fee` fields
- Add `bank_name`, `cheque_number`, `cheque_date` fields for cheque payments
- Auto-generate follow-up task when cheque status = 'under_clearing' and clearance_date passed

**Feature 3: Payment Allocation Engine**

- Allow a single payment to be allocated across multiple installments
- Create a `PaymentAllocation` model mapping payments → installments with amounts
- Support overpayment (customer credit) and underpayment (partial allocation)
- Expose `unallocated_amount` property on Payment

**Feature 4: Bank Reconciliation**

- Add bank statement import (CSV/Excel)
- Match payments against bank transactions
- Flag unmatched payments for investigation
- Support Pakistani banks (HBL, UBL, Allied, Meezan, etc.)

**Feature 5: Automatic Receipt Generation**

```python
class Receipt(models.Model):
    receipt_number = models.CharField(max_length=50, unique=True)  # RCP-YYYY-MM-XXXXX
    payment = models.ForeignKey(Payment, on_delete=models.CASCADE, related_name='receipts')
    receipt_date = models.DateField(auto_now_add=True)
    generated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    receipt_template = models.CharField(max_length=50, default='standard')
    pdf_file = models.FileField(upload_to='receipts/%Y/%m/', blank=True)
    is_duplicate = models.BooleanField(default=False)
    cancellation_reason = models.TextField(blank=True)
```

Receipt numbering: `RCP-2026-07-00001` (includes year-month for easier searching)
Support receipt cancellation with audit trail.

**Feature 6: Refund Processing**

```python
class Refund(models.Model):
    REASON_CHOICES = [
        ('cancellation', 'Booking Cancellation'),
        ('overpayment', 'Overpayment'),
        ('booking_transfer', 'Booking Transfer'),
        ('other', 'Other'),
    ]
    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name='refunds')
    original_payment = models.ForeignKey(Payment, on_delete=models.SET_NULL, null=True)
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    reason = models.CharField(max_length=30, choices=REASON_CHOICES)
    status = models.CharField(max_length=20, choices=REFUND_STATUS_CHOICES, default='pending')
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='refunds_approved')
    processed_date = models.DateTimeField(null=True, blank=True)
```

### 3.4 Payment Verification API Design

```python
class PaymentViewSet(viewsets.ModelViewSet):
    @action(detail=True, methods=['post'])
    def verify(self, request, pk=None):
        """Verify a payment and allocate to installments."""
        payment = self.get_object()
        serializer = PaymentVerificationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        # 1. Update payment status
        # 2. Create receipt
        # 3. Allocate to installments (with partial support)
        # 4. Update customer ledger
        # 5. Update booking advance_paid
        # 6. Log audit trail

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject payment with reason."""
    
    @action(detail=True, methods=['post'])
    def mark_bounced(self, request, pk=None):
        """Mark cheque as bounced."""
    
    @action(detail=True, methods=['post'])
    def allocate(self, request, pk=None):
        """Allocate payment to specific installments."""
        # Accepts list of {installment_id, amount}
```

---

## 4. Booking & Reservation Workflows

### 4.1 Current State Analysis

Existing Booking model:
- Statuses: `pending`, `confirmed`, `cancelled`, `completed`
- Fields: booking_id, customer, plot, booking_date, total_amount, advance_paid, notes
- Relationship: Each booking has one plot, one customer
- On create: sets plot status to 'booked'

**Gaps identified:**
- No reservation/holding period before confirmation
- No booking transfer process (customer A → customer B)
- No cancellation policy (refund amount based on timing)
- No down-payment/advance tracking against installments
- No booking amendment history
- No block booking (one customer booking multiple plots)
- No payment schedule view for the customer
- No ledger entries (remaining balance is a calculated property, not stored)

### 4.2 Recommended Booking Lifecycle

```
                    ┌─────────────┐
                    │  Inquiry    │  (Lead/Prospect)
                    │  Created    │
                    └──────┬──────┘
                           │
                           ▼
                    ┌─────────────┐
                    │  Reserved   │  ← Token/holding amount paid
                    │  (Holding)  │    Plot marked 'reserved' (7-14 day hold)
                    └──────┬──────┘
                           │
                  ┌────────┴────────┐
                  ▼                 ▼
           ┌────────────┐   ┌────────────┐
           │  Booking   │   │  Hold      │  ← Holding expired
           │  Confirmed │   │  Expired   │    Plot released
           └─────┬──────┘   └────────────┘
                 │
        ┌────────┴────────┐
        ▼                 ▼
   ┌────────┐     ┌───────────┐
   │ Active │     │ Booking   │  ← Customer requests cancellation
   │ (Paying│     │ Cancelled │    or developer cancels
   │Install-│     └─────┬─────┘
   │ments)  │           │
   └───┬────┘           ▼
       │           ┌───────────┐
       │           │  Refund   │  ← Partial/full refund
       │           │  Processed│    based on cancellation policy
       ▼           └───────────┘
   ┌────────┐
   │Completed│  ← All installments paid, possession given
   │(Sold)   │
   └────────┘
```

### 4.3 Concrete Feature Recommendations

**Feature 1: Reservation System**

```python
class Reservation(models.Model):
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='reservations')
    plot = models.ForeignKey(Plot, on_delete=models.CASCADE, related_name='reservations')
    token_amount = models.DecimalField(max_digits=15, decimal_places=2)
    reserved_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()  # Typically 7-14 days
    status = models.CharField(max_length=20, choices=[
        ('active', 'Active'),
        ('converted', 'Converted to Booking'),
        ('expired', 'Expired'),
        ('cancelled', 'Cancelled'),
    ])
    # Auto-expire via management command
```

During reservation period, plot status = 'reserved'. After expiry, plot returns to 'available'.

**Feature 2: Booking Transfer**

```python
class BookingTransfer(models.Model):
    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name='transfers')
    from_customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='transfers_out')
    to_customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='transfers_in')
    transfer_fee = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    previous_payments_handling = models.CharField(max_length=20, choices=[
        ('transfer', 'Transfer to New Customer'),
        ('refund', 'Refund to Original Customer'),
    ])
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    transfer_date = models.DateField(auto_now_add=True)
    notes = models.TextField(blank=True)
```

**Feature 3: Cancellation Policy Engine**

```python
class CancellationPolicy(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField()
    is_active = models.BooleanField(default=True)
    
class CancellationTier(models.Model):
    policy = models.ForeignKey(CancellationPolicy, on_delete=models.CASCADE, related_name='tiers')
    from_days = models.IntegerField(help_text="Days from booking date (inclusive)")
    to_days = models.IntegerField(help_text="Days from booking date (inclusive)")
    refund_percentage = models.DecimalField(max_digits=5, decimal_places=2)
    deduction_notes = models.TextField(blank=True)
```

Example tiers for Pakistani real estate:
- 0-30 days: 75% refund (25% deduction as processing fee)
- 31-90 days: 50% refund
- 91-180 days: 25% refund
- After 180 days: No refund / transfer only
- Full refund only if developer fails to deliver on timeline

**Feature 4: Booking Amendments History**

```python
class BookingAmendment(models.Model):
    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name='amendments')
    field_name = models.CharField(max_length=100)
    old_value = models.TextField()
    new_value = models.TextField()
    changed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    changed_at = models.DateTimeField(auto_now_add=True)
```

**Feature 5: Block Booking / Multi-Plot Bookings**

Allow one customer to book multiple plots in a single booking or linked bookings. Add a `BookingGroup` model:

```python
class BookingGroup(models.Model):
    group_id = models.CharField(max_length=20, unique=True, editable=False)
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='booking_groups')
    total_amount = models.DecimalField(max_digits=15, decimal_places=2)
    discount_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    payment_plan = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
```

Then Booking gets a `group = models.ForeignKey(BookingGroup, null=True, blank=True)` field.

**Feature 6: Booking Payment Schedule / Milestone View**

Generate a visual payment schedule that shows:
- All upcoming installments and their due dates
- Payment status (paid/pending/overdue)
- Running total paid
- Outstanding balance
- Late fees applied

---

## 5. Property Inventory & Status Tracking

### 5.1 Current State Analysis

Existing:
- `Project` model (name, description, location, total_plots, is_active)
- `Plot` model (plot_number, project, plot_type, size_marla, size_sqft, price, status)
- Plot statuses: `available`, `reserved`, `booked`, `sold`, `cancelled`
- Project has computed `available_plots` property

**Gaps identified:**
- No price history tracking
- No plot category/block/phases support
- No inventory holds
- No bulk plot import (for large projects of 1000+ plots)
- No plot features/amenities tracking
- No document attachments (maps, NOC, possession letters)
- No plot dimensions / corner plot flag
- No installment plan templates per project
- No property images

### 5.2 Concrete Feature Recommendations

**Feature 1: Extended Property Model**

```python
class Plot(models.Model):
    # ... existing fields ...
    
    # Add these fields:
    block = models.CharField(max_length=50, blank=True, help_text="Block/Sector e.g. A, B, C")
    phase = models.CharField(max_length=50, blank=True, help_text="Phase number e.g. 1, 2")
    street_number = models.CharField(max_length=20, blank=True)
    is_corner = models.BooleanField(default=False)
    is_park_facing = models.BooleanField(default=False)
    facing_direction = models.CharField(max_length=20, blank=True, help_text="North/South/East/West")
    features = models.ManyToManyField('PlotFeature', blank=True)
    documents = models.ManyToManyField('PlotDocument', blank=True)
    holding_deposit = models.DecimalField(max_digits=15, decimal_places=2, default=0,
                                          help_text="Required token/holding amount")
    
class PlotFeature(models.Model):
    name = models.CharField(max_length=100)  # e.g. "Park Facing", "Corner", "Wider Road"
    icon = models.CharField(max_length=50, blank=True)

class PlotDocument(models.Model):
    plot = models.ForeignKey(Plot, on_delete=models.CASCADE, related_name='documents')
    title = models.CharField(max_length=100)
    file = models.FileField(upload_to='plot_documents/%Y/%m/')
    uploaded_at = models.DateTimeField(auto_now_add=True)
```

**Feature 2: Price History Tracking**

```python
class PriceHistory(models.Model):
    plot = models.ForeignKey(Plot, on_delete=models.CASCADE, related_name='price_history')
    old_price = models.DecimalField(max_digits=15, decimal_places=2)
    new_price = models.DecimalField(max_digits=15, decimal_places=2)
    change_reason = models.CharField(max_length=100, blank=True)
    changed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    changed_at = models.DateTimeField(auto_now_add=True)
```

**Feature 3: Inventory Status Flow**

```
            ┌────────────┐
            │  Available │ ◄── From imported/inventory load
            └──────┬─────┘
                   │
         ┌─────────┴─────────┐
         ▼                   ▼
   ┌──────────┐       ┌──────────┐
   │ Reserved │       │ On Hold  │  ← Internal hold (staff/admin)
   │ (Booking)│       │ (Admin)  │    for VIP/director allocations
   └─────┬────┘       └─────┬────┘
         │                  │
         ▼                  │
   ┌──────────┐            │
   │  Booked  │ ◄──────────┘
   │ (Active) │
   └─────┬────┘
         │
    ┌────┴────┐
    ▼         ▼
┌────────┐ ┌───────────┐
│  Sold  │ │ Cancelled │  ← Booking cancelled, plot freed
│(Final) │ └───────────┘
└────────┘       │
                 ▼
            ┌──────────┐
            │Available │  ← Only if cancellation policy
            └──────────┘    allows re-release
```

**Feature 4: Bulk Plot Import**

Create a management command and API endpoint for CSV/Excel import:

```python
class PlotImport(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE)
    file = models.FileField(upload_to='plot_imports/')
    uploaded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=[('pending', 'Pending'), ('processing', 'Processing'), ('completed', 'Completed'), ('failed', 'Failed')])
    error_log = models.TextField(blank=True)
    plots_created = models.PositiveIntegerField(default=0)
    plots_failed = models.PositiveIntegerField(default=0)
```

CSV columns expected: `plot_number, block, phase, plot_type, size_marla, size_sqft, price, is_corner`

**Feature 5: Phased Project Releases**

```python
class ProjectPhase(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='phases')
    name = models.CharField(max_length=100)  # e.g. "Phase 1", "Phase 2"
    description = models.TextField(blank=True)
    launch_date = models.DateField()
    total_plots = models.PositiveIntegerField()
    is_active = models.BooleanField(default=True)
    price_per_marla = models.DecimalField(max_digits=15, decimal_places=2)
```

---

## 6. Installment Plans

### 6.1 Current State Analysis

Existing:
- `InstallmentPlan` with total_installments, installment_amount, start_date, due_day, late_fee_per_day
- `Installment` with installment_number, due_date, amount, late_fee, paid_amount, status
- Statuses: pending, paid, overdue, partial
- One-to-one with Booking

**Gaps identified:**
- No installment plan templates (pre-defined plans per project)
- No auto-generation with dynamic amount (some plans have different amounts per installment)
- No grace period before late fees apply
- No minimum late fee amount
- No late fee waiver workflow
- No installment rescheduling (postpone/restructure)
- No prepayment discount calculation
- No payment reminders (SMS/email)
- No balloon installment support (larger final installment)
- No quarterly/half-yearly installment frequency support

### 6.2 Concrete Feature Recommendations

**Feature 1: Installment Plan Templates**

```python
class InstallmentPlanTemplate(models.Model):
    FREQUENCY_CHOICES = [
        ('monthly', 'Monthly'),
        ('quarterly', 'Quarterly'),
        ('half_yearly', 'Half-Yearly'),
        ('yearly', 'Yearly'),
    ]
    name = models.CharField(max_length=100)  # e.g. "36-Month Plan", "12-Quarter Plan"
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='plan_templates')
    total_installments = models.PositiveIntegerField()
    frequency = models.CharField(max_length=20, choices=FREQUENCY_CHOICES, default='monthly')
    down_payment_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=10.00)
    installment_percentage = models.DecimalField(max_digits=5, decimal_places=2, 
                                                  help_text="% of remaining balance per installment")
    late_fee_per_day = models.DecimalField(max_digits=10, decimal_places=2)
    grace_period_days = models.PositiveIntegerField(default=0)
    has_balloon_payment = models.BooleanField(default=False)
    balloon_installment_number = models.PositiveIntegerField(null=True, blank=True)
    balloon_multiplier = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True,
                                              help_text="Multiplier for balloon payment (e.g. 2.0 = double)")
    is_active = models.BooleanField(default=True)
```

**Feature 2: Installment Auto-Generation with Grace Periods**

```python
class InstallmentPlan(models.Model):
    # ... existing fields, plus:
    template = models.ForeignKey(InstallmentPlanTemplate, on_delete=models.SET_NULL, null=True, blank=True)
    down_payment_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    frequency = models.CharField(max_length=20, choices=FREQUENCY_CHOICES, default='monthly')
    grace_period_days = models.PositiveIntegerField(default=0)
    total_late_fee_applied = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    last_auto_processed = models.DateTimeField(null=True, blank=True)

    def auto_generate(self):
        """Generate all installments based on plan configuration."""
        # Calculate installment amount based on (total_amount - down_payment) / total_installments
        # Or use percentage-based calculation for each period
        # Handle balloon payment
        # Set due dates based on start_date and frequency
        pass

    def generate_late_fees(self):
        """Run daily: mark overdue installments and calculate late fees."""
        today = date.today()
        overdue = self.installments.filter(
            status__in=['pending', 'partial'],
            due_date__lt=today
        )
        for inst in overdue:
            days_overdue = (today - inst.due_date).days
            # Apply grace period
            effective_days = max(0, days_overdue - self.grace_period_days)
            late_fee = effective_days * self.late_fee_per_day
            # Apply minimum late fee if configured
            inst.late_fee = max(late_fee, self.min_late_fee) if self.min_late_fee else late_fee
            if inst.status == 'pending':
                inst.status = 'overdue'
            inst.save()
```

**Feature 3: Installment Rescheduling**

```python
class InstallmentReschedule(models.Model):
    plan = models.ForeignKey(InstallmentPlan, on_delete=models.CASCADE, related_name='reschedules')
    original_due_date = models.DateField()
    new_due_date = models.DateField()
    reason = models.CharField(max_length=100, choices=RESCHEDULE_REASONS)
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    rescheduled_at = models.DateTimeField(auto_now_add=True)
    # Optional: restructure remaining installments
    new_installment_count = models.PositiveIntegerField(null=True, blank=True)
    new_installment_amount = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
```

**Feature 4: Late Fee Engine (Pakistan-Specific)**

```python
class LateFeeConfiguration(models.Model):
    plan = models.OneToOneField(InstallmentPlan, on_delete=models.CASCADE, related_name='late_fee_config')
    calculation_method = models.CharField(max_length=20, choices=[
        ('per_day', 'Per Day Fixed'),
        ('per_day_percentage', 'Percentage Per Day'),
        ('monthly_percentage', 'Monthly Percentage'),
        ('tiered', 'Tiered'),
    ], default='per_day')
    rate = models.DecimalField(max_digits=10, decimal_places=2, default=0, 
                                help_text="Rate per day or percentage")
    max_late_fee_per_installment = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    min_late_fee = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    waiver_allowed = models.BooleanField(default=True)
    
    # Tiered configuration (JSON)
    # e.g. [{"from_days": 0, "to_days": 30, "fee": 100},
    #        {"from_days": 31, "to_days": 60, "fee": 250},
    #        {"from_days": 61, "to_days": 999, "fee": 500}]
    tiered_rules = models.JSONField(blank=True, default=dict)
```

**Feature 5: Payment Reminder (Notification) System**

```python
class PaymentReminder(models.Model):
    TYPE_CHOICES = [
        ('upcoming', 'Upcoming Due Reminder'),
        ('overdue', 'Overdue Reminder'),
        ('grace_period', 'Grace Period Ending'),
        ('late_fee', 'Late Fee Applied'),
    ]
    
    installment = models.ForeignKey(Installment, on_delete=models.CASCADE, related_name='reminders')
    reminder_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    sent_at = models.DateTimeField(auto_now_add=True)
    sent_via = models.CharField(max_length=20, choices=[('sms', 'SMS'), ('email', 'Email'), ('both', 'Both')])
    message = models.TextField()
    delivery_status = models.CharField(max_length=20, default='pending')
```

Reminder schedule:
- **7 days before due**: Upcoming reminder
- **3 days before due**: Second reminder
- **Due date**: Payment due notice
- **Day 1 overdue**: Late payment notice (with grace period info)
- **Day 30 overdue**: Final notice
- **Day 60+**: Legal notice warning

**Feature 6: Prepayment / Early Settlement**

```python
class EarlySettlement(models.Model):
    plan = models.ForeignKey(InstallmentPlan, on_delete=models.CASCADE, related_name='early_settlements')
    remaining_installments = models.PositiveIntegerField()
    total_remaining_amount = models.DecimalField(max_digits=15, decimal_places=2)
    discount_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    discount_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    settlement_amount = models.DecimalField(max_digits=15, decimal_places=2)
    approved = models.BooleanField(default=False)
    settled_at = models.DateTimeField(null=True, blank=True)
```

### 6.3 Installment Plan Template Examples (Pakistani Market)

| Plan Name | Duration | Installments | Down Payment | Late Fee |
|-----------|----------|-------------|-------------|---------|
| 3-Year Monthly | 36 months | 36 monthly | 10% | PKR 100/day |
| 5-Year Monthly | 60 months | 60 monthly | 10% | PKR 50/day |
| 2-Year Quarterly | 24 months | 8 quarterly | 20% | PKR 500/month |
| 3-Year Half-Yearly | 36 months | 6 half-yearly | 25% | 2% per month |
| Full Payment | Immediate | 1 (full) | 100% | N/A |
| Custom | Variable | Variable | Flexible | Configurable |

---

## 7. Customer Ledger & Running Balance

### 7.1 Current State Analysis

Currently:
- Booking has `remaining_balance` property = `total_amount - advance_paid`
- No formal customer ledger exists
- Balance is computed, not stored (no audit trail)
- No transaction history view
- No aging analysis

### 7.2 Recommended Approach: Journal-Entry Ledger

Implement a proper double-entry or simplified single-entry ledger per customer:

```python
class CustomerLedgerEntry(models.Model):
    """Single entry in customer's financial ledger."""
    TRANSACTION_TYPES = [
        ('booking', 'New Booking'),
        ('payment', 'Payment Received'),
        ('refund', 'Refund Issued'),
        ('late_fee', 'Late Fee Applied'),
        ('waiver', 'Late Fee Waived'),
        ('discount', 'Discount Applied'),
        ('transfer_in', 'Transfer In (Booking Transfer)'),
        ('transfer_out', 'Transfer Out (Booking Transfer)'),
        ('adjustment', 'Manual Adjustment'),
        ('reversal', 'Entry Reversal'),
    ]
    
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='ledger_entries')
    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name='ledger_entries', null=True, blank=True)
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPES)
    reference_id = models.CharField(max_length=50, blank=True, help_text="Payment ID / Receipt ID / Refund ID")
    debit = models.DecimalField(max_digits=15, decimal_places=2, default=0, help_text="Amount owed by customer")
    credit = models.DecimalField(max_digits=15, decimal_places=2, default=0, help_text="Amount paid/adjusted")
    running_balance = models.DecimalField(max_digits=15, decimal_places=2, help_text="Balance after this entry")
    description = models.TextField(blank=True)
    entry_date = models.DateField()
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['entry_date', 'created_at']
        indexes = [
            models.Index(fields=['customer', 'entry_date']),
            models.Index(fields=['booking', 'entry_date']),
        ]
```

**Ledger Entry Rules:**
- `debit` = customer owes money (new booking, late fee applied)
- `credit` = customer pays/is credited (payment received, refund issued, waiver)
- `running_balance` = previous_running_balance + debit - credit
- All ledger entries are immutable (no editing) — reverse with a reversal entry
- Every payment verification creates a ledger entry
- Every installment due creates a ledger entry (debit)

### 7.3 Running Balance Display

```
┌─────────────────────────────────────────────────────────────────┐
│ CUSTOMER LEDGER: CUS-00001 - Ahmad Khan                         │
│ Booking: BKG-00001 - Gold City Phase 1 - Plot 127              │
│ Total Amount: PKR 5,000,000                                    │
├────────┬──────────┬──────────┬──────────┬──────────┬───────────┤
│ Date   │ Type     │ Debit    │ Credit   │ Balance  │ Reference │
├────────┼──────────┼──────────┼──────────┼──────────┼───────────┤
│01-Jan  │ Booking  │5,000,000 │    0     │5,000,000 │ BKG-00001 │
│01-Jan  │ Payment  │    0     │ 500,000  │4,500,000 │ PAY-00001 │
│01-Feb  │ Payment  │    0     │ 100,000  │4,400,000 │ PAY-00002 │
│01-Mar  │ Late Fee │  3,000   │    0     │4,403,000 │           │
│01-Mar  │ Payment  │    0     │ 100,000  │4,303,000 │ PAY-00003 │
│01-Apr  │ Payment  │    0     │ 100,000  │4,203,000 │ PAY-00004 │
│...     │ ...      │ ...      │ ...      │ ...      │ ...       │
├────────┼──────────┼──────────┼──────────┼──────────┼───────────┤
│        │ TOTAL    │5,003,000 │ 800,000  │4,203,000 │           │
└────────┴──────────┴──────────┴──────────┴──────────┴───────────┘
```

### 7.4 Accounts Receivable Aging Report

```python
class ReceivableAging(models.Model):
    """Materialized or computed view of aging buckets."""
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE)
    booking = models.ForeignKey(Booking, on_delete=models.CASCADE)
    # Computed fields
    current_balance = models.DecimalField(max_digits=15, decimal_places=2)
    days_overdue = models.IntegerField()
    aging_bucket = models.CharField(max_length=20, choices=[
        ('current', 'Current (0-30)'),
        ('1_30', '1-30 Days'),
        ('31_60', '31-60 Days'),
        ('61_90', '61-90 Days'),
        ('90_plus', '90+ Days'),
    ])
```

---

## 8. Role-Based Access & Approval Chains

### 8.1 Current State

- Roles: super_admin, admin, sales, accounts, management
- Basic permission decorators on views
- No approval workflow configurations

### 8.2 Recommended Approach

**Feature 1: Granular Permissions**

```python
# Instead of simple role names, use Django's built-in permission system
# Create custom permissions per model:

class Booking(models.Model):
    class Meta:
        permissions = [
            ('can_approve_booking', 'Can approve bookings'),
            ('can_cancel_booking', 'Can cancel bookings'),
            ('can_transfer_booking', 'Can transfer bookings'),
            ('can_verify_payment', 'Can verify payments'),
            ('can_waive_late_fee', 'Can waive late fees'),
            ('can_process_refund', 'Can process refunds'),
            ('can_manage_inventory', 'Can manage property inventory'),
            ('can_view_reports', 'Can view financial reports'),
            ('can_manage_users', 'Can manage users and roles'),
        ]
```

**Feature 2: Approval Chain Configuration**

```python
class ApprovalChain(models.Model):
    """Configurable approval workflow."""
    name = models.CharField(max_length=100)  # e.g. "Payment Verification"
    model_name = models.CharField(max_length=100)  # e.g. "Payment"
    trigger_field = models.CharField(max_length=100)  # Field that triggers workflow
    trigger_value = models.CharField(max_length=100)  # e.g. "pending" → triggers approval
    is_active = models.BooleanField(default=True)

class ApprovalStep(models.Model):
    chain = models.ForeignKey(ApprovalChain, on_delete=models.CASCADE, related_name='steps')
    step_order = models.PositiveIntegerField()
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    can_approve = models.BooleanField(default=True)
    can_reject = models.BooleanField(default=True)
    min_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0, 
                                      help_text="Only triggers if amount ≥ this")
    max_amount = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
```

Example approval chains for Pakistani real estate:
1. **Payment ≥ PKR 500,000**: Sales → Accounts → Management
2. **Payment < PKR 500,000**: Sales → Accounts
3. **Booking Cancellation**: Sales → Accounts → Management (for refund approval)
4. **Late Fee Waiver**: Accounts → Management
5. **Price Change**: Management only

**Feature 3: Approval Request Model**

```python
class ApprovalRequest(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('cancelled', 'Cancelled'),
    ]
    
    approval_step = models.ForeignKey(ApprovalStep, on_delete=models.CASCADE)
    requested_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='approval_requests')
    object_id = models.PositiveIntegerField()
    object_type = models.CharField(max_length=100)  # e.g. "Payment", "Booking"
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    reviewed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='approvals_given')
    review_notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
```

---

## 9. Data Model Recommendations

### 9.1 New Models To Create

| App | Model | Purpose |
|-----|-------|---------|
| **bookings** | Reservation | Token-based plot holding |
| **bookings** | BookingTransfer | Customer-to-customer booking transfers |
| **bookings** | CancellationPolicy | Configurable cancellation rules |
| **bookings** | CancellationTier | Per-time-period refund percentages |
| **bookings** | BookingAmendment | Audit trail for booking changes |
| **bookings** | BookingGroup | Multi-plot booking grouping |
| **bookings** | EarlySettlement | Prepayment discount processing |
| **bookings** | InstallmentPlanTemplate | Reusable installment plan definitions |
| **bookings** | LateFeeConfiguration | Advanced late fee calculation rules |
| **bookings** | InstallmentReschedule | Installment due date adjustments |
| **bookings** | PaymentReminder | SMS/email reminder tracking |
| **payments** | PaymentAllocation | Payment distribution across installments |
| **payments** | Refund | Refund request processing |
| **properties** | PlotFeature | Property amenity/feature tags |
| **properties** | PlotDocument | Document attachments per plot |
| **properties** | PriceHistory | Plot price change tracking |
| **properties** | ProjectPhase | Phased project releases |
| **properties** | PlotImport | Bulk import tracking |
| **customers** | CustomerLedgerEntry | Double-entry ledger per customer |
| **customers** | ReceivableAging | AR aging analysis |
| **core** | ApprovalChain | Configurable approval workflows |
| **core** | ApprovalStep | Per-role approval steps |
| **core** | ApprovalRequest | Individual approval requests |

### 9.2 Field Enhancements To Existing Models

| Model | New Fields |
|-------|-----------|
| **Booking** | `group` (FK BookingGroup), `cancellation_policy` (FK), `cancellation_fee` (Decimal), `possession_date` (Date), `is_possession_taken` (Boolean), `source` (CharField: website/walk-in/referral) |
| **Payment** | `clearance_date` (Date), `bounce_reason` (TextField), `bounce_fee` (Decimal), `bank_name` (CharField), `cheque_number` (CharField), `cheque_date` (Date), `unallocated_amount` (Decimal) |
| **Receipt** | `receipt_number` (CharField), `is_duplicate` (Boolean), `cancellation_reason` (TextField) |
| **Plot** | `block` (CharField), `phase` (CharField), `street_number` (CharField), `is_corner` (Boolean), `is_park_facing` (Boolean), `facing_direction` (CharField), `features` (M2M PlotFeature), `documents` (M2M PlotDocument), `holding_deposit` (Decimal) |
| **InstallmentPlan** | `template` (FK), `down_payment_amount` (Decimal), `frequency` (CharField), `grace_period_days` (Integer), `total_late_fee_applied` (Decimal) |
| **Installment** | `payment_allocation` (JSONField for audit trail of which payments covered this installment) |

### 9.3 Relationship Map (Simplified)

```
Project ──┬── Phase
          └── Plot ──┬── PriceHistory
                     ├── PlotFeature (M2M)
                     ├── PlotDocument
                     ├── Reservation ──── Customer
                     └── Booking ──────── Customer
                           │
                     ┌─────┴──────┐
                     │            │
               InstallmentPlan  BookingAmendment
                     │
               Installment ──┬── PaymentAllocation
                             │
                       Payment ──── Receipt
                             │
                          Refund
                             │
                     CustomerLedgerEntry
```

---

## 10. Implementation Roadmap

### Phase 1: Foundation (Week 1-2)
- [ ] Add extended fields to existing models (Plot, Booking, Payment)
- [ ] Create CustomerLedgerEntry model and migration
- [ ] Implement booking create → ledger entry (debit) signal
- [ ] Implement payment verify → ledger entry (credit) signal
- [ ] Create PriceHistory model with create/update signals
- [ ] Add audit trail for all model changes
- [ ] Refine DRF serializers/views for new fields

### Phase 2: Booking & Reservation (Week 3-4)
- [ ] Create Reservation model with auto-expiry
- [ ] Create BookingTransfer model with API endpoints
- [ ] Create CancellationPolicy + CancellationTier
- [ ] Implement cancellation workflow with refund calculation
- [ ] Create BookingAmendment model (write on every booking save)
- [ ] Add booking group support (multi-plot booking)

### Phase 3: Installment System (Week 5-6)
- [ ] Create InstallmentPlanTemplate with CRUD
- [ ] Enhance InstallmentPlan to support frequency, grace periods
- [ ] Build auto-generation logic for installments
- [ ] Build late fee engine (management command: daily run)
- [ ] Create InstallmentReschedule model
- [ ] Create EarlySettlement model
- [ ] Create PaymentAllocation model (partial payment across installments)

### Phase 4: Payment Enhancements (Week 7-8)
- [ ] Add cheque clearing workflow (under_clearing → cleared/bounced)
- [ ] Implement PaymentAllocation API
- [ ] Create Refund model with approval workflow
- [ ] Enhance Receipt with numbering, cancellation
- [ ] Add bank statement import (CSV)
- [ ] Build payment reports (daily collection, aging, projections)

### Phase 5: Approval & Notifications (Week 9-10)
- [ ] Create ApprovalChain + ApprovalStep models
- [ ] Create ApprovalRequest model with API
- [ ] Build approval dashboard UI
- [ ] Create PaymentReminder model
- [ ] Implement SMS/email notification triggers
- [ ] Add configurable reminder schedule

### Phase 6: Reporting & Polish (Week 11-12)
- [ ] Build accounts receivable aging report
- [ ] Build payment projection dashboard
- [ ] Build installment schedule viewer (per customer)
- [ ] Build sales pipeline report
- [ ] Build property inventory dashboard (per project/phase)
- [ ] Implement data export (PDF, Excel)

---

## 11. Appendix: Workflow Diagrams (ASCII)

### 11.1 Complete Booking-to-Possession Flow

```
INQUIRY ──→ RESERVATION ──→ BOOKING ──→ INSTALLMENTS ──→ COMPLETION
    │            │             │              │              │
    │            │             │              │              │
    ▼            ▼             ▼              ▼              ▼
┌────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐ ┌──────────────┐
│Lead    │ │Token Paid│ │Confirmed │ │Payment     │ │Possession    │
│Created │ │Plot Held │ │+ Plan    │ │Schedule    │ │Given         │
│        │ │7-14 days │ │Selected  │ │Active      │ │Plot Sold     │
└────────┘ └──────────┘ └──────────┘ └────────────┘ └──────────────┘
                                    │
                                    ├── On time → Next installment
                                    ├── Overdue → Late fee applied
                                    ├── 90+ days → Final notice
                                    └── Default → Legal action / cancellation
```

### 11.2 Payment Allocation Flow

```
                    ┌────────────┐
                    │  Payment   │
                    │  Received  │
                    └─────┬──────┘
                          │
                   Pending Verification
                          │
                    ┌─────┴─────┐
                    │           │
               Verified     Rejected
                    │           │
                    ▼           ▼
            ┌───────────┐  ┌───────────┐
            │ Receipt   │  │ Notify    │
            │ Generated │  │ Customer  │
            └─────┬─────┘  └───────────┘
                  │
                  ▼
           Payment Allocation
                  │
        ┌─────────┴─────────┐
        │                   │
   Single Installment   Multiple Installments
        │                   │
        ▼                   ▼
   Update Installment   Split amounts across
   paid_amount (+fee)   multiple installments
        │                   │
        ▼                   ▼
   Update Customer      Update Customer
   Ledger Entry         Ledger Entries
   (Credit)             (Multiple Credits)
```

### 11.3 Late Fee Calculation Timeline

```
Due Date    Grace Period   Late Fee Starts    Max Cap
   │             │               │               │
   ▼             ▼               ▼               ▼
───┼─────────────┼───────────────┼───────────────┼──────►
   │             │               │               │
   │             │          Late Fee =         Late Fee
   │             │          days_overdue ×     capped at
   │             │          rate/day           max_fee
   │             │
   │     No late fee during grace period
   │
Reminder      Reminder      Reminder        Final
sent 7 days   sent due     sent day 30     Notice
before due    date                          day 60
```

---

## 12. Key Takeaways

1. **Pakistan-specific requirements** (CNIC, Marla/Kanal, Raast, JazzCash, installment dominance) must be baked into every module, not added as an afterthought.

2. **Installment management is the core differentiator** — most open-source Django real estate projects lack sophisticated installment handling. This is where Samana's ERP can significantly outperform generic solutions.

3. **Customer ledger must be immutable** — once a ledger entry is created, it should never be edited. Use reversal entries for corrections. This provides full financial audit trail required for Pakistani real estate regulatory compliance.

4. **Phased rollout** — start with Phase 1-2 (foundation + booking enhancements) which deliver immediate value, then build sophisticated payment/installment features.

5. **Approval chains should be configurable** — Pakistan real estate companies have varying delegation structures. Hard-coded approval logic will require frequent code changes. Configurable approval steps solve this.

6. **Automated reminders are essential** — Pakistani customers often have irregular payment patterns. Automated SMS/email reminders improve collection rates significantly.

7. **Reporting drives adoption** — management will only trust the system if they can see real-time aging reports, collection dashboards, and payment projections.

---

*End of Report*

*Compiled from: GitHub open-source Django real estate projects, Wikipedia real estate software domain analysis, ERPNext documentation patterns, Odoo real estate module architecture, and Pakistan-specific real estate market practices.*