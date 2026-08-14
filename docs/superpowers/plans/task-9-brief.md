# Task 9: Add Payment Type Column Enhancement

## Context
Enhance the payment type badge colors in the payments list table for better visual distinction.

## Files to Modify
- `templates/payments.html`

## What to Do
Replace the generic `badge-secondary` type badge with color-coded badges based on payment type.

## Exact Changes Required

### In templates/payments.html, find the existing type column in the table:

```html
<td><span class="badge badge-secondary">{{ payment.get_payment_type_display }}</span></td>
```

### Replace with:

```html
<td>
    <span class="badge {% if payment.payment_type == 'down_payment' %}badge-success{% elif payment.payment_type == 'installment' %}badge-info{% elif payment.payment_type == 'full_payment' %}badge-primary{% elif payment.payment_type == 'late_fee' %}badge-danger{% else %}badge-secondary{% endif %}">
        {{ payment.get_payment_type_display }}
    </span>
</td>
```

## Verification
Run: `venv\Scripts\python.exe manage.py check`

## Commit
```bash
git add templates/payments.html
git commit -m "feat: enhance payment type badges with color coding"
```
