# Task 8: Add Payment Type Filter Tabs to Payments List

## Context
Add payment type filter tabs to the payments list page so users can filter by Down Payment, Installment, Full Payment, etc.

## Files to Modify
- `core/views.py` (payments_view function)
- `templates/payments.html`

## What to Do

### 1. In core/views.py, find the `payments_view` function and add type filtering

After the existing method filter logic (look for `method_filter = request.GET.get('method', '')`), add:

```python
    type_filter = request.GET.get('type', '')
    if type_filter:
        if type_filter == 'other':
            # "Other" = exclude the main 4 types
            payments = payments.exclude(payment_type__in=['down_payment', 'installment', 'full_payment', 'late_fee'])
        else:
            payments = payments.filter(payment_type=type_filter)
```

Also add to the context dict:
```python
        'type_filter': type_filter,
```

And add type counts for the tabs (after the existing stats calculation):
```python
    # Type counts for filter tabs
    all_payments = Payment.objects.all()
    type_counts = {
        'all': all_payments.count(),
        'down_payment': all_payments.filter(payment_type='down_payment').count(),
        'installment': all_payments.filter(payment_type='installment').count(),
        'full_payment': all_payments.filter(payment_type='full_payment').count(),
        'late_fee': all_payments.filter(payment_type='late_fee').count(),
        'other': all_payments.exclude(payment_type__in=['down_payment', 'installment', 'full_payment', 'late_fee']).count(),
    }
```

Add `type_counts` to context.

### 2. In templates/payments.html, add type filter tabs

After the stats section (after the 3 stat cards) and BEFORE the filters card (the search/method filter form), add:

```html
        <!-- Payment Type Tabs -->
        <div class="card animate-fade-up stagger-2" style="padding:16px 20px;">
            <div style="display:flex; gap:8px; flex-wrap:wrap; align-items:center;">
                <a href="{% url 'payments' %}{% if search %}?search={{ search }}{% endif %}" 
                   class="btn btn-sm {% if not type_filter %}btn-primary{% else %}btn-ghost{% endif %}">
                    All <span class="badge badge-info" style="margin-left:4px;">{{ type_counts.all }}</span>
                </a>
                <a href="{% url 'payments' %}?type=down_payment{% if search %}&search={{ search }}{% endif %}" 
                   class="btn btn-sm {% if type_filter == 'down_payment' %}btn-primary{% else %}btn-ghost{% endif %}">
                    Down Payments <span class="badge badge-info" style="margin-left:4px;">{{ type_counts.down_payment }}</span>
                </a>
                <a href="{% url 'payments' %}?type=installment{% if search %}&search={{ search }}{% endif %}" 
                   class="btn btn-sm {% if type_filter == 'installment' %}btn-primary{% else %}btn-ghost{% endif %}">
                    Installments <span class="badge badge-info" style="margin-left:4px;">{{ type_counts.installment }}</span>
                </a>
                <a href="{% url 'payments' %}?type=full_payment{% if search %}&search={{ search }}{% endif %}" 
                   class="btn btn-sm {% if type_filter == 'full_payment' %}btn-primary{% else %}btn-ghost{% endif %}">
                    Full Payments <span class="badge badge-info" style="margin-left:4px;">{{ type_counts.full_payment }}</span>
                </a>
                <a href="{% url 'payments' %}?type=late_fee{% if search %}&search={{ search }}{% endif %}" 
                   class="btn btn-sm {% if type_filter == 'late_fee' %}btn-primary{% else %}btn-ghost{% endif %}">
                    Late Fees <span class="badge badge-info" style="margin-left:4px;">{{ type_counts.late_fee }}</span>
                </a>
                <a href="{% url 'payments' %}?type=other{% if search %}&search={{ search }}{% endif %}" 
                   class="btn btn-sm {% if type_filter == 'other' %}btn-primary{% else %}btn-ghost{% endif %}">
                    Other <span class="badge badge-info" style="margin-left:4px;">{{ type_counts.other }}</span>
                </a>
            </div>
        </div>
```

### 3. Add hidden type field to filter form

In the existing filter form in payments.html, add this inside the form (to preserve type filter when searching):
```html
{% if type_filter %}
<input type="hidden" name="type" value="{{ type_filter }}">
{% endif %}
```

## Verification
Run: `venv\Scripts\python.exe manage.py check`

## Commit
```bash
git add core/views.py templates/payments.html
git commit -m "feat: add payment type filter tabs to payments list page"
```
