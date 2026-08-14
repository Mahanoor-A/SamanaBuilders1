# Task 1 Review: Fix Dashboard Revenue Calculation

## Spec Compliance: PASS

The dashboard revenue calculation changes (lines 78-110 in current `core/views.py`) match the task brief exactly:

- ✅ Removed `unreported_advance` logic (old lines 78-170)
- ✅ Replaced with `verified_payments_qs = Payment.objects.filter(status='verified')`
- ✅ `total_revenue` uses simple `Sum('amount')` aggregate
- ✅ `monthly_revenue` filters by `month_start`
- ✅ Changed trend window from 6 months to 12 months (`timedelta(days=365)`)
- ✅ New list comprehension for `monthly_revenue_data`
- ✅ New `max_amount` calculation with conditional fallback
- ✅ All code after the revenue section (booking stats, payment stats, charts, context dict) remains intact

## Code Quality: APPROVED

The revenue-specific code is clean and matches the exact specification.

## Findings

### CRITICAL: Scope Violation — Commit Contains Unrelated Changes

The commit `fix: simplify dashboard revenue to SUM of verified payments` contains **877 insertions across 19 files**, but Task 1 only required changes to `core/views.py` lines 78-170.

**Unrelated changes bundled in this commit:**

| Change | Files |
|--------|-------|
| `financial_reports_view` function (new) | `core/views.py:321-410` |
| Customer nominee form integration | `core/views.py:438-535`, `customers/forms.py`, `customers/models.py` |
| Installment plan template in booking create | `core/views.py:752-835`, `bookings/forms.py` |
| `plan_templates_api_view` (new endpoint) | `core/views.py:836-870` |
| `booking_confirm_view` (new endpoint) | `core/views.py:915-975` |
| Payment validation, duplicate check, atomic transaction | `core/views.py:1104-1230` |
| PDF generation views (3 new) | `core/views.py:1325-1385` |
| Notification integration in payments | `core/views.py:1217-1226` |
| New imports (transaction, HttpResponse, CustomerNominee, Expense) | `core/views.py:8-22` |
| Template changes (base, sidebar, forms, detail pages) | Multiple templates |
| Settings, URL, requirements changes | `samana_erp/settings.py`, `samana_erp/urls.py`, `requirements.txt` |

### Recommendation

The revenue calculation fix is correct and complete. However, the commit should have been scoped to only the revenue calculation changes. The unrelated features (financial reports, nominee forms, installment templates, PDF views, etc.) should be in separate commits for proper traceability and rollback capability.

### No Functional Bugs Found

The revenue calculation itself is correct — no double-counting, proper aggregation, proper fallback to 0, and the 12-month window is appropriate.
