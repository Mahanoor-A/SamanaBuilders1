# Payment Module Improvements + Dashboard Redesign

## Date: 2026-08-13

## Problem Statement
1. Dashboard revenue calculation is wrong — double-counts payments due to "unreported advance" logic
2. Payment module doesn't clearly display payments grouped by type
3. Dashboard lacks a full financial overview

## Design Decisions
- **Keep payment module as-is** — 8 payment types, 7 methods, auto-verify on creation
- **Fix revenue calculation** — simple SUM of verified payments
- **Improve payment list** — add type filter tabs, better type display
- **Full financial overview on dashboard** — revenue, collections, defaults, charts

## Changes

### 1. Fix Dashboard Revenue Calculation (`core/views.py`)

**Current (broken):**
```python
verified_payment_total = SUM(verified payments)
unreported_advance = per-booking(advance_paid - SUM(verified payments for booking))
total_revenue = verified_payment_total + unreported_advance
```

**New (correct):**
```python
total_revenue = SUM(verified payments)
```

Remove all `unreported_advance` logic from:
- `dashboard_view` (total + monthly + chart)
- Monthly revenue trend calculation

### 2. Improve Payment List Page (`payments.html`)

Add payment type filter tabs at the top:
- All | Down Payments | Installments | Full Payments | Late Fees | Other

Each tab shows count and total amount for that type.

### 3. Full Financial Dashboard (`dashboard.html`)

**Stats Row (6 cards):**
1. Total Revenue — SUM of all verified payments
2. This Month's Collection — SUM of verified payments this month
3. Pending Payments — COUNT + SUM of pending status
4. Overdue Installments — COUNT + SUM of overdue installments
5. Collection Rate — (paid installments / total installments) * 100
6. Active Bookings — COUNT of active/confirmed bookings

**Charts (4 charts):**
1. Revenue Trend — bar chart, monthly, last 12 months
2. Revenue by Payment Type — doughnut chart
3. Revenue by Payment Method — doughnut chart
4. Collection Rate Trend — line chart, monthly %

**Tables (3 tables):**
1. Recent Payments — last 10 with type badge, status badge
2. Project-wise Revenue — revenue per project with booking count
3. Top Defaulters — customers with most overdue installments

### 4. Payment Detail Improvements (`payment_detail.html`)

- Show payment type prominently at top
- Show what this payment covers (installment schedule with this payment highlighted)
- Show receipt inline if generated

## Files to Modify
- `core/views.py` — dashboard_view revenue calculation
- `templates/dashboard.html` — full financial overview redesign
- `templates/payments.html` — add type filter tabs
- `templates/payment_detail.html` — improve type display

## Files NOT Modified
- `payments/models.py` — keep all 8 payment types
- `payments/forms.py` — keep current form
- `templates/payment_form.html` — keep current form
