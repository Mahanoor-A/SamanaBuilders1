# Payments Module Redesign — Design Spec

## Overview

Redesign the Payments module of the Samana Builders Real Estate ERP to deliver a professional payment workflow similar to enterprise property developers (Emaar, Bahria Town, DHA). The redesign preserves all existing data and extends the current backend rather than replacing it.

## Architecture

### ERP Routing (New Setup)

```
/erp                          → DashboardPage
/erp/payments                 → PaymentsPage (enhanced)
/erp/payments/new             → PaymentFormPage (redesigned)
/erp/payments/:id             → PaymentDetailPage (new, replaces verify page)
/erp/payments/:id/edit        → PaymentFormPage (edit mode)
/erp/bookings/:id             → BookingDetailPage (+ Payment Plan tab)
... existing pages retained
```

`BrowserRouter` wraps `App.jsx`. The corporate site and ERP are separate route trees under the same domain. `Layout.jsx` (sidebar + header + `<Outlet/>`) wraps all ERP routes.

### Missing Component

`Sidebar.jsx` will be created — it's imported by `Layout.jsx` but doesn't exist.

---

## Backend Changes

### 1. New Model: `PaymentAttachment`

**File:** `payments/models.py`

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
```

### 2. Extend `Payment` Model

Add one field:

```python
PAYMENT_TYPE_CHOICES = [
    ('down_payment', 'Down Payment'),
    ('installment', 'Installment'),
    ('full_payment', 'Full Payment'),
    ('other', 'Other'),
]
payment_type = models.CharField(max_length=20, choices=PAYMENT_TYPE_CHOICES, default='other')
```

No columns are removed. All existing data is preserved.

### 3. New Serializer Fields

Maintain existing serializers. Add:

- `PaymentSerializer`: add `payment_type`, `payment_type_display`, `attachments` (nested `PaymentAttachmentSerializer`)
- New `PaymentAttachmentSerializer` (standard ModelSerializer with `file` URL)
- `PaymentCreateSerializer`: add `payment_type`, conditional validation per method via dynamic field requirements

### 4. New API Endpoint

**`GET /api/bookings/{id}/payment-summary/`**

Returns:

```json
{
  "booking_id": "BKG-00001",
  "property_price": 5000000.00,
  "discount": 200000.00,
  "final_price": 4800000.00,
  "down_payment": 480000.00,
  "remaining_amount": 4320000.00,
  "total_paid": 960000.00,
  "paid_installments": 2,
  "total_installments": 12,
  "outstanding": 3840000.00,
  "progress_percent": 20,
  "installment_plan": { ... },
  "installments": [
    { "number": 1, "due_date": "2026-08-01", "amount": 360000, "status": "paid", ... },
    ...
  ]
}
```

Implemented as a `@action(detail=True)` on the `BookingViewSet`.

---

## Frontend — ERP Router

### `App.jsx` Changes

Replace simple corporate layout with:

```jsx
<BrowserRouter>
  <Routes>
    <Route path="/" element={<CorporateLayout />}>
      <Route index element={<HomePage />} />
      <Route path="about" element={<About />} />
      ...
    </Route>
    <Route path="/erp" element={<Layout />}>
      <Route index element={<DashboardPage />} />
      <Route path="payments" element={<PaymentsPage />} />
      <Route path="payments/new" element={<PaymentFormPage />} />
      <Route path="payments/:id" element={<PaymentDetailPage />} />
      <Route path="payments/:id/edit" element={<PaymentFormPage />} />
      <Route path="bookings" element={<BookingsPage />} />
      <Route path="bookings/new" element={<BookingFormPage />} />
      <Route path="bookings/:id" element={<BookingDetailPage />} />
      ... all other ERP pages
    </Route>
  </Routes>
</BrowserRouter>
```

`CorporateLayout` wraps Navbar + Footer.
`Layout` is the existing ERP shell with Sidebar + Header + `<Outlet/>`.

### `Sidebar.jsx`

Created to match the design system. Navigation items: Dashboard, Customers, Bookings, Properties, Payments, Users, Audit Logs. Uses `lucide-react` icons. Active state highlight. Collapsible on mobile.

---

## Frontend — Payments Page (`PaymentsPage.jsx`)

### Stat Cards Row

Four stat cards above the table:
- **Total Collected** — sum of verified payments (PKR)
- **Outstanding** — sum of remaining balances across all bookings (PKR)  
- **Overdue** — count of installments past due date
- **Today's Collections** — sum of payments received today (PKR)

Each uses `StatCard` with appropriate icon and gradient color.

### Enhanced Table Columns

| Column | Content |
|--------|---------|
| Payment ID | `PAY-00001` + date below |
| Booking | Booking ID + customer name |
| Customer | Customer name with user icon |
| Payment Type | Badge: Down Payment / Installment / Full Payment |
| Installment # | Number or `—` |
| Amount | PKR formatted |
| Method | Method label |
| Status | `StatusBadge` component |
| Date | Formatted date |
| Verified By | Username or `—` |
| Actions | Dropdown: View, Edit, Verify (if pending), Delete (if admin) |

### Filters

- Search input (searches payment_id, customer name, booking ID)
- Status filter pills: All, Pending, Verified, Rejected, Bounced
- Method filter dropdown
- Date range filter (date_from / date_to)

---

## Frontend — Payment Form (`PaymentFormPage.jsx`)

Complete redesign. Three card sections in responsive 2-column layout with no empty space.

### Section 1: Payment Summary Card

- **Payment Type** dropdown: Down Payment / Installment / Full Remaining Amount / Other
- **Booking** selector (loads booking data on select)
- Readonly display when booking selected:
  - Property Price
  - Discount (if any)
  - Final Sale Price
  - Down Payment Amount
  - Remaining Balance
  - (values loaded from `/api/bookings/{id}/payment-summary/`)
- **Installment #** dropdown (only shown when Payment Type = "Installment")
- **Amount** field (auto-filled if Down Payment or Installment selected, editable)
- **Payment Date** field

### Section 2: Payment Method Card

- **Method** dropdown: Cash, Cheque, Bank Transfer, Online Banking, EasyPaisa, JazzCash, Raast

**Dynamic fields per method:**

**Cash:** Received By, Receipt Number, Payment Date, Notes (compact, 2-column)

**Cheque:** Cheque Number, Cheque Amount, Cheque Date, Issue Date, Bank Name, Branch Name, Account Holder Name, Cheque Image Upload, Remarks — (3-column grid)

**Bank Transfer:** Customer Bank, Customer Account Number, Transaction ID, Reference Number, Transfer Date, Company Bank, Company Account, Paid To, Transaction Screenshot Upload — (3-column grid)

**EasyPaisa:** Sender Name, Sender Phone, Transaction ID, Transfer Date, Company EasyPaisa Number, Payment Screenshot — (2-column grid)

**JazzCash:** Sender Name, Sender Phone, Transaction ID, Transfer Date, Company JazzCash Number, Payment Screenshot — (2-column grid)

**Raast:** Sender IBAN, Transaction ID, Reference Number, Transfer Date, Company Account, Payment Screenshot — (2-column grid)

**Online Banking:** Bank, Reference Number, Transaction ID, Transfer Date, Screenshot Upload — (2-column grid)

### Section 3: Upload & Notes Card

- `FileUpload` component area
- Notes textarea (compact, 2 rows)

### Auto Status Logic

- If any proof file uploaded → status auto-set to "Pending Verification"
- If no proof and method is Cash → status "Pending" (admin reviews)
- On save → POST `/api/payments/` with all fields

---

## Frontend — Payment Detail Page (`PaymentDetailPage.jsx`)

Replaces `PaymentVerifyPage.jsx`. Full detail view with organized sections:

### Top Bar

- Back button + Payment ID + StatusBadge + action buttons (Verify/Reject/Edit/Download Receipt/Delete)

### Info Cards (2-column grid)

| Card | Fields |
|------|--------|
| **Customer** | Name, Phone, Email, CNIC |
| **Booking** | Booking ID, Date, Plot, Project |
| **Property** | Property/Plot number, Size, Category, Price |
| **Payment** | Amount, Type, Method, Date, Reference #, Status |
| **Installment** | (if applicable) Installment #, Due Date, Plan Name |

### Timeline Section

Vertical timeline showing: Created (date) → Submitted (date) → Verified/Rejected (date + verifier name)

### Attachments Section

- Images shown as thumbnails with lightbox preview
- Download links for each file
- Attachment type labels

### Verification Actions

- **Verify** button → POST `/api/payments/{id}/verify/` with `{action: "verify"}`
- **Reject** button → POST with `{action: "reject", notes: "..."}`
- Only shown for admin/super_admin roles and when status is "pending"

---

## Frontend — Booking Payment Plan Tab

New "Payment Plan" tab in `BookingDetailPage.jsx` (alongside existing Payments/Installments tabs).

### No Plan Yet

Shows Payment Plan setup form:

- **Property Price** (readonly from booking)
- **Discount** input (optional, defaults to 0)
- **Final Sale Price** (auto-calculated: Property Price - Discount)
- **Down Payment** input
- **Remaining Amount** (auto-calculated: Final Sale Price - Down Payment)
- **Payment Option**: One Time Payment / Installment Plan

If Installment Plan:
- **Duration** dropdown: 6, 12, 18, 24, 36, 48, 60 months OR custom
- **Monthly Installment** (auto-calculated: Remaining Amount / Months)
- Live summary card update on every input change
- **Save Plan** button → creates InstallmentPlan via API + auto-generates installments

### Plan Exists

Shows:

- **Payment Progress** — large progress bar `████████░░ 80%`
- **Summary Cards**: Property Price, Discount, Final Price, Down Payment, Remaining Amount, Monthly Installment, Total Paid
- **Installment Schedule** table:
  | # | Due Date | Amount | Status | Paid Amount | Remaining | Action |
  Includes status badges, "Receive Payment" button per pending installment
- **Record Payment** button → navigates to `/erp/payments/new?booking=X&installment=Y`

---

## Frontend — New Shared Components

### `FileUpload.jsx`

- Drag & drop zone + click-to-browse
- Shows preview thumbnails before upload
- Accepts: JPG, PNG, PDF, WEBP
- Max file size indicator
- Upload progress
- Remove button per file
- Returns array of File objects

### `PaymentSummaryCard.jsx`

- Compact card displaying financial summary
- Key-value pairs with highlighted total values
- Props: `{ propertyPrice, discount, finalPrice, downPayment, remainingAmount, monthlyInstallment? }`
- Animated number transitions

### `InstallmentSchedule.jsx`

- Table of installments with status badges
- Sortable by number, due date, status
- Click row → quick-pay action
- Scrollable with sticky header

### `PaymentProgressBar.jsx`

- Horizontal progress bar with gradient fill
- Shows percentage text (e.g., "80%")
- Animated width transition
- Color: green (high), amber (mid), red (low)

---

## Data Flow

```
Booking Created
  ↓
User opens Booking Detail → "Payment Plan" tab
  ↓
Sets up: Discount, Down Payment, Duration (if installment)
  ↓
API creates/updates InstallmentPlan + generates Installments
  ↓
Customer pays Down Payment
  ↓
User clicks "Receive Payment" → selects Down Payment type
  ↓
Payment form records amount → POST /api/payments/
  ↓
Payment status = pending (or pending_verification if proof uploaded)
  ↓
Admin verifies → POST /api/payments/{id}/verify/
  ↓
On verify:
  - Installment.paid_amount += payment.amount
  - Installment.status updated (paid/partial)
  - Booking.advance_paid += payment.amount
  - Booking.payment_progress recalculated
  - PaymentAttachment marked as verified
```

---

## UI Conventions

All pages follow existing design system:
- Cards: `bg-surface rounded-2xl border border-border shadow-sm`
- Buttons: gradient primary `bg-gradient-to-r from-primary to-primary-light`
- Form inputs: floating label pattern with `peer` classes
- Icons: `lucide-react`
- Spacing: consistent `p-4`, `p-6`, `gap-4`, `gap-5`
- Grid: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4`
- Animations: `animate-fade-in-up` on page load

---

## What Is NOT Changing

- Existing `Payment`, `InstallmentPlan`, `Installment`, `Refund`, `Receipt` models are preserved
- Existing `PaymentCreateSerializer`, `PaymentSerializer`, etc. are extended, not replaced
- Existing `PaymentViewSet` endpoints remain operational
- All existing data remains valid and accessible
- No fields are removed from any model
- The corporate website (`/`) is untouched

## Files to Create

| File | Purpose |
|------|---------|
| `frontend/src/components/erp/Sidebar.jsx` | ERP sidebar navigation |
| `frontend/src/components/erp/FileUpload.jsx` | File upload with preview |
| `frontend/src/components/erp/PaymentSummaryCard.jsx` | Financial summary card |
| `frontend/src/components/erp/InstallmentSchedule.jsx` | Installment schedule table |
| `frontend/src/components/erp/PaymentProgressBar.jsx` | Progress bar |
| `frontend/src/pages/erp/PaymentDetailPage.jsx` | Full payment detail view |
| `frontend/src/pages/LoginPage.jsx` | (move from erp subdir? no, keep as is) |

## Files to Modify

| File | Changes |
|------|---------|
| `payments/models.py` | Add `PaymentAttachment` model, add `payment_type` to Payment |
| `payments/serializers.py` | Add PaymentAttachmentSerializer, extend PaymentSerializer |
| `payments/api_views.py` | Extend for new fields |
| `bookings/api_views.py` or views | Add `payment-summary` action |
| `frontend/src/App.jsx` | Add BrowserRouter, Routes, ERP route tree |
| `frontend/src/main.jsx` | Remove ThemeProvider wrap (move to App) |
| `frontend/src/pages/erp/PaymentsPage.jsx` | Redesign with stat cards, enhanced columns |
| `frontend/src/pages/erp/PaymentFormPage.jsx` | Complete redesign with dynamic method fields |
| `frontend/src/pages/erp/PaymentVerifyPage.jsx` | Replace with PaymentDetailPage |
| `frontend/src/pages/erp/BookingDetailPage.jsx` | Add Payment Plan tab |
| `frontend/src/services/api.js` | Add paymentAPI service helpers |

---

## Acceptance Criteria

1. User can set up a payment plan (one-time or installment) from booking detail
2. Installment schedule auto-generates when plan is saved
3. Recording a payment shows dynamic fields based on payment method
4. File uploads attach to payments and show preview
5. Payment verification flow works via the verify action endpoint
6. Payment list shows all required columns with stat cards
7. Booking detail shows payment progress bar
8. All existing data remains accessible
9. Responsive layout works on desktop and tablet
10. ERP routing works for all pages including payments
