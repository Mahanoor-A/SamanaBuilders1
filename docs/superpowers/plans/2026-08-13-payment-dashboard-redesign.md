# Payment Module Improvements + Dashboard Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix dashboard revenue calculation, add payment type filter tabs to payment list, and add full financial overview to dashboard.

**Architecture:** Simplify dashboard revenue to SUM of verified payments (remove unreported advance logic). Add payment type breakdown chart and collection rate chart. Add type filter tabs to payments list page. Add project-wise revenue table and top defaulters table.

**Tech Stack:** Django 6.0.7, Django ORM, Chart.js, PostgreSQL (dev: SQLite3)

## Global Constraints
- Keep all 8 payment types, 7 methods, auto-verify on creation — no changes to payment model/form
- Payment module form and workflow stay as-is
- Dashboard uses Chart.js (already in project)
- Custom CSS theme system (no Bootstrap)
- Currency: PKR

---

## File Structure

| File | Action | Purpose |
|------|--------|---------|
| `core/views.py` | Modify (dashboard_view) | Fix revenue calculation, add new context data |
| `templates/dashboard.html` | Modify | Add stats, charts, tables for full financial overview |
| `templates/payments.html` | Modify | Add payment type filter tabs |

---

### Task 1: Fix Dashboard Revenue Calculation

**Files:**
- Modify: `core/views.py:78-170` (dashboard_view revenue section)

**Interfaces:**
- Consumes: `Payment` model (status='verified'), `Booking` model (advance_paid)
- Produces: `total_revenue`, `monthly_revenue`, `monthly_revenue_data` context variables

- [ ] **Step 1: Replace revenue calculation in dashboard_view**

In `core/views.py`, replace lines 78-170 (from `def dashboard_view` through `monthly_revenue_data`) with:

```python
def dashboard_view(request):
    today = timezone.now().date()
    month_start = today.replace(day=1)
    
    verified_payments_qs = Payment.objects.filter(status='verified')
    
    # Revenue = simple sum of all verified payments
    total_revenue = verified_payments_qs.aggregate(total=Sum('amount'))['total'] or 0
    
    # Monthly revenue
    monthly_revenue = verified_payments_qs.filter(
        payment_date__gte=month_start
    ).aggregate(total=Sum('amount'))['total'] or 0
    
    # Monthly revenue trend (last 12 months)
    twelve_months_ago = today - timedelta(days=365)
    
    payment_monthly = (
        verified_payments_qs.filter(payment_date__gte=twelve_months_ago)
        .annotate(month=TruncMonth('payment_date'))
        .values('month')
        .annotate(total=Sum('amount'))
        .order_by('month')
    )
    
    monthly_revenue_data = [
        {'label': entry['month'].strftime('%b %Y'), 'amount': float(entry['total'])}
        for entry in payment_monthly
    ]
    
    max_amount = max([item['amount'] for item in monthly_revenue_data]) if monthly_revenue_data else 1
    for item in monthly_revenue_data:
        item['pct'] = round((item['amount'] / max_amount) * 100, 1)
```

- [ ] **Step 2: Verify system check passes**

Run: `venv\Scripts\python.exe manage.py check`
Expected: System check identified no issues (0 silenced)

- [ ] **Step 3: Commit**

```bash
git add core/views.py
git commit -m "fix: simplify dashboard revenue to SUM of verified payments"
```

---

### Task 2: Add Revenue by Payment Type Chart Data

**Files:**
- Modify: `core/views.py` (dashboard_view, after revenue calculation)

**Interfaces:**
- Consumes: `Payment` model (payment_type, status='verified', amount)
- Produces: `payment_type_data` context variable for doughnut chart

- [ ] **Step 1: Add payment type breakdown to dashboard_view**

In `core/views.py`, after the `monthly_revenue_data` section (after Step 1's code), add:

```python
    # Revenue by payment type
    type_data = (
        verified_payments_qs.values('payment_type')
        .annotate(total=Sum('amount'))
        .order_by('-total')
    )
    type_labels = dict(Payment.PAYMENT_TYPE_CHOICES)
    payment_type_data = [
        {'type': type_labels.get(t['payment_type'], t['payment_type']), 'total': float(t['total'])}
        for t in type_data
    ]
```

- [ ] **Step 2: Add payment_type_data to context dict**

In the `context` dictionary at the end of `dashboard_view`, add:

```python
        'payment_type_data': payment_type_data,
```

- [ ] **Step 3: Verify system check passes**

Run: `venv\Scripts\python.exe manage.py check`
Expected: System check identified no issues (0 silenced)

- [ ] **Step 4: Commit**

```bash
git add core/views.py
git commit -m "feat: add revenue by payment type breakdown to dashboard"
```

---

### Task 3: Add Collection Rate Trend Data

**Files:**
- Modify: `core/views.py` (dashboard_view)

**Interfaces:**
- Consumes: `Installment` model (status, paid_amount, amount, due_date)
- Produces: `collection_rate_trend` context variable for line chart

- [ ] **Step 1: Add collection rate trend to dashboard_view**

In `core/views.py`, after the payment_type_data section, add:

```python
    # Collection rate trend (last 12 months)
    collection_trend = []
    for i in range(11, -1, -1):
        # Calculate month boundaries
        target_date = today - timedelta(days=30 * i)
        m_start = target_date.replace(day=1)
        if m_start.month == 12:
            m_end = m_start.replace(year=m_start.year + 1, month=1, day=1)
        else:
            m_end = m_start.replace(month=m_start.month + 1, day=1)
        
        month_total = Installment.objects.filter(
            due_date__gte=m_start, due_date__lt=m_end
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        month_paid = Installment.objects.filter(
            due_date__gte=m_start, due_date__lt=m_end
        ).aggregate(total=Sum('paid_amount'))['total'] or 0
        
        rate = round((month_paid / month_total) * 100, 1) if month_total > 0 else 0
        if rate > 100:
            rate = 100
        
        collection_trend.append({
            'label': m_start.strftime('%b %Y'),
            'rate': rate
        })
```

- [ ] **Step 2: Add collection_trend to context dict**

In the `context` dictionary, add:

```python
        'collection_trend': collection_trend,
```

- [ ] **Step 3: Verify system check passes**

Run: `venv\Scripts\python.exe manage.py check`
Expected: System check identified no issues (0 silenced)

- [ ] **Step 4: Commit**

```bash
git add core/views.py
git commit -m "feat: add collection rate trend data for dashboard chart"
```

---

### Task 4: Add Project-wise Revenue and Top Defaulters Data

**Files:**
- Modify: `core/views.py` (dashboard_view)

**Interfaces:**
- Consumes: `Payment` (status='verified'), `Booking`, `Plot`, `Customer`, `Installment`
- Produces: `project_revenue_data`, `top_defaulters_data` context variables

- [ ] **Step 1: Add project-wise revenue to dashboard_view**

In `core/views.py`, after the collection_trend section, add:

```python
    # Project-wise revenue
    project_revenue = (
        verified_payments_qs
        .values('booking__plot__project__name')
        .annotate(revenue=Sum('amount'), count=Count('id'))
        .order_by('-revenue')
    )
    project_revenue_data = [
        {
            'project': p['booking__plot__project__name'] or 'Unknown',
            'revenue': float(p['revenue']),
            'count': p['count']
        }
        for p in project_revenue
    ]
    
    # Top defaulters (customers with overdue installments)
    overdue_installments = Installment.objects.filter(
        status='overdue'
    ).select_related('plan__booking__customer')
    
    defaulter_map = {}
    for inst in overdue_installments:
        customer = inst.plan.booking.customer
        if customer.pk not in defaulter_map:
            defaulter_map[customer.pk] = {
                'name': customer.full_name,
                'customer_id': customer.customer_id,
                'overdue_count': 0,
                'overdue_amount': 0,
            }
        defaulter_map[customer.pk]['overdue_count'] += 1
        defaulter_map[customer.pk]['overdue_amount'] += float(inst.amount + inst.late_fee - inst.paid_amount)
    
    top_defaulters_data = sorted(
        defaulter_map.values(),
        key=lambda x: x['overdue_amount'],
        reverse=True
    )[:10]
```

- [ ] **Step 2: Add to context dict**

In the `context` dictionary, add:

```python
        'project_revenue_data': project_revenue_data,
        'top_defaulters_data': top_defaulters_data,
```

- [ ] **Step 3: Verify system check passes**

Run: `venv\Scripts\python.exe manage.py check`
Expected: System check identified no issues (0 silenced)

- [ ] **Step 4: Commit**

```bash
git add core/views.py
git commit -m "feat: add project-wise revenue and top defaulters to dashboard"
```

---

### Task 5: Add New Stats Cards to Dashboard Template

**Files:**
- Modify: `templates/dashboard.html` (Stats Row 2 section)

**Interfaces:**
- Consumes: `total_revenue`, `monthly_revenue`, `pending_payments`, `overdue_installments`, `collection_rate`, `active_bookings` from context

- [ ] **Step 1: Replace Stats Row 2 in dashboard.html**

Find the existing Stats Row 2 (the `{% if can_view_payments %}` block with 4 stat cards) and replace it with 6 stat cards:

```html
        <!-- Stats Row 2 - Financial Overview -->
        {% if can_view_payments %}
        <div class="stats-grid" style="grid-template-columns: repeat(3, 1fr);">
            <div class="stat-card animate-fade-up stagger-5">
                <div class="stat-icon green">💰</div>
                <div class="stat-value" style="font-size:22px; font-weight:700;">Rs. <span data-target="{{ total_revenue|default:0|floatformat:0 }}">{{ total_revenue|default:0|floatformat:0 }}</span></div>
                <div class="stat-label">Total Revenue</div>
            </div>
            <div class="stat-card animate-fade-up stagger-6">
                <div class="stat-icon blue">📈</div>
                <div class="stat-value" style="font-size:22px; font-weight:700;">Rs. <span data-target="{{ monthly_revenue|default:0|floatformat:0 }}">{{ monthly_revenue|default:0|floatformat:0 }}</span></div>
                <div class="stat-label">This Month</div>
            </div>
            <div class="stat-card animate-fade-up stagger-7">
                <div class="stat-icon amber">⏳</div>
                <div class="stat-value" data-target="{{ pending_payments|default:0 }}">{{ pending_payments|default:0 }}</div>
                <div class="stat-label">Pending Payments</div>
            </div>
            <div class="stat-card animate-fade-up stagger-8">
                <div class="stat-icon red">⚠️</div>
                <div class="stat-value" data-target="{{ overdue_installments|default:0 }}">{{ overdue_installments|default:0 }}</div>
                <div class="stat-label">Overdue Installments</div>
            </div>
            <div class="stat-card animate-fade-up stagger-9">
                <div class="stat-icon teal">📊</div>
                <div class="stat-value" data-target="{{ collection_rate|default:0 }}">{{ collection_rate|default:0 }}%</div>
                <div class="stat-label">Collection Rate</div>
            </div>
            <div class="stat-card animate-fade-up stagger-10">
                <div class="stat-icon violet">📋</div>
                <div class="stat-value" data-target="{{ active_bookings|default:0 }}">{{ active_bookings|default:0 }}</div>
                <div class="stat-label">Active Bookings</div>
            </div>
        </div>
        {% endif %}
```

- [ ] **Step 2: Verify template renders**

Run: `venv\Scripts\python.exe manage.py check`
Expected: System check identified no issues (0 silenced)

- [ ] **Step 3: Commit**

```bash
git add templates/dashboard.html
git commit -m "feat: add 6 financial overview stat cards to dashboard"
```

---

### Task 6: Add Revenue by Payment Type and Collection Rate Charts

**Files:**
- Modify: `templates/dashboard.html` (Charts Area section)

**Interfaces:**
- Consumes: `payment_type_data`, `collection_rate_trend` from context
- Produces: Chart.js doughnut and line charts

- [ ] **Step 1: Add new chart section to dashboard.html**

Find the existing "Payment Method & Revenue by Project" section and add a new row BEFORE it:

```html
        <!-- Revenue by Type & Collection Rate -->
        <div class="charts-grid-2col">
            {% if can_view_payments and payment_type_data %}
            <div class="card animate-fade-up stagger-5">
                <div class="card-header">
                    <h3>📊 Revenue by Payment Type</h3>
                </div>
                <div class="chart-container" style="height:260px; display:flex; align-items:center; justify-content:center;">
                    <canvas id="paymentTypeChart" style="max-width:260px; max-height:260px;"></canvas>
                </div>
            </div>
            {% endif %}
            {% if can_view_payments and collection_rate_trend %}
            <div class="card animate-fade-up stagger-6">
                <div class="card-header">
                    <h3>📈 Collection Rate Trend</h3>
                </div>
                <div class="chart-container">
                    <canvas id="collectionRateChart"></canvas>
                </div>
            </div>
            {% endif %}
        </div>
```

- [ ] **Step 2: Add Chart.js initialization for payment type doughnut**

In the `<script>` section at the bottom, add after the existing charts:

```javascript
    {% if can_view_payments and payment_type_data %}
    var typeColors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#f97316', '#ec4899', '#ef4444'];
    new Chart(document.getElementById('paymentTypeChart'), {
        type: 'doughnut',
        data: {
            labels: [{% for t in payment_type_data %}'{{ t.type }}'{% if not forloop.last %},{% endif %}{% endfor %}],
            datasets: [{
                data: [{% for t in payment_type_data %}{{ t.total|floatformat:0 }}{% if not forloop.last %},{% endif %}{% endfor %}],
                backgroundColor: typeColors.slice(0, {{ payment_type_data|length }}),
                borderWidth: 0,
                hoverOffset: 10,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            cutout: '55%',
            animation: Object.assign({}, anim, { animateRotate: true }),
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { padding: 10, usePointStyle: true, color: colors.text, font: { size: 10 }, boxWidth: 8 }
                },
                tooltip: Object.assign({}, tip, {
                    callbacks: {
                        label: function(ctx) {
                            var t = ctx.dataset.data.reduce(function(a,b){return a+b},0);
                            var p = t > 0 ? ((ctx.raw / t) * 100).toFixed(1) : 0;
                            return ' ' + ctx.label + ': Rs. ' + Number(ctx.raw).toLocaleString() + ' (' + p + '%)';
                        }
                    }
                })
            }
        }
    });
    {% endif %}
```

- [ ] **Step 3: Add Chart.js initialization for collection rate line chart**

Add after the payment type chart:

```javascript
    {% if can_view_payments and collection_rate_trend %}
    new Chart(document.getElementById('collectionRateChart'), {
        type: 'line',
        data: {
            labels: [{% for item in collection_rate_trend %}'{{ item.label }}'{% if not forloop.last %},{% endif %}{% endfor %}],
            datasets: [{
                label: 'Collection Rate %',
                data: [{% for item in collection_rate_trend %}{{ item.rate }}{% if not forloop.last %},{% endif %}{% endfor %}],
                borderColor: c.emerald,
                backgroundColor: 'rgba(16,185,129,0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 3,
                pointHoverRadius: 6,
                borderWidth: 2,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            animation: anim,
            plugins: {
                legend: { display: false },
                tooltip: Object.assign({}, tip, {
                    callbacks: {
                        label: function(ctx) { return 'Collection Rate: ' + ctx.raw + '%'; }
                    }
                })
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    border: { display: false },
                    grid: { color: colors.border + '50', drawTicks: false },
                    ticks: {
                        color: colors.text,
                        maxTicksLimit: 5,
                        font: { size: 11 },
                        callback: function(v) { return v + '%'; }
                    }
                },
                x: {
                    border: { display: false },
                    grid: { display: false },
                    ticks: { color: colors.text, font: { size: 10, weight: '600' }, maxRotation: 45 }
                }
            }
        }
    });
    {% endif %}
```

- [ ] **Step 4: Verify template renders**

Run: `venv\Scripts\python.exe manage.py check`
Expected: System check identified no issues (0 silenced)

- [ ] **Step 5: Commit**

```bash
git add templates/dashboard.html
git commit -m "feat: add revenue by type doughnut and collection rate trend charts"
```

---

### Task 7: Add Project-wise Revenue and Top Defaulters Tables

**Files:**
- Modify: `templates/dashboard.html` (Tables section)

**Interfaces:**
- Consumes: `project_revenue_data`, `top_defaulters_data` from context

- [ ] **Step 1: Add project-wise revenue table**

Find the existing "Recent Bookings" section and add a new section BEFORE it:

```html
        <!-- Project-wise Revenue & Top Defaulters -->
        <div class="charts-grid-2col">
            {% if can_view_payments and project_revenue_data %}
            <div class="card animate-fade-up stagger-6">
                <div class="card-header">
                    <h3>🏗️ Project-wise Revenue</h3>
                </div>
                <div class="table-container">
                    <table class="sortable">
                        <thead>
                            <tr>
                                <th>Project</th>
                                <th>Revenue (Rs.)</th>
                                <th>Payments</th>
                            </tr>
                        </thead>
                        <tbody>
                            {% for p in project_revenue_data %}
                            <tr>
                                <td><strong>{{ p.project }}</strong></td>
                                <td style="font-weight:600;">Rs. {{ p.revenue|floatformat:0 }}</td>
                                <td>{{ p.count }}</td>
                            </tr>
                            {% endfor %}
                        </tbody>
                    </table>
                </div>
            </div>
            {% endif %}

            {% if can_view_payments and top_defaulters_data %}
            <div class="card animate-fade-up stagger-7">
                <div class="card-header">
                    <h3>⚠️ Top Defaulters</h3>
                </div>
                <div class="table-container">
                    <table class="sortable">
                        <thead>
                            <tr>
                                <th>Customer</th>
                                <th>Overdue</th>
                                <th>Amount (Rs.)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {% for d in top_defaulters_data %}
                            <tr>
                                <td>
                                    <strong>{{ d.name }}</strong>
                                    <br><span style="font-size:12px; color:var(--text-secondary);">{{ d.customer_id }}</span>
                                </td>
                                <td>{{ d.overdue_count }} installments</td>
                                <td style="font-weight:600; color:var(--danger);">Rs. {{ d.overdue_amount|floatformat:0 }}</td>
                            </tr>
                            {% endfor %}
                        </tbody>
                    </table>
                </div>
            </div>
            {% endif %}
        </div>
```

- [ ] **Step 2: Verify template renders**

Run: `venv\Scripts\python.exe manage.py check`
Expected: System check identified no issues (0 silenced)

- [ ] **Step 3: Commit**

```bash
git add templates/dashboard.html
git commit -m "feat: add project-wise revenue and top defaulters tables to dashboard"
```

---

### Task 8: Add Payment Type Filter Tabs to Payments List

**Files:**
- Modify: `templates/payments.html`
- Modify: `core/views.py` (payments_view)

**Interfaces:**
- Consumes: `Payment.payment_type` choices, payment queryset
- Produces: Filtered payment list by type

- [ ] **Step 1: Add type filter to payments_view**

In `core/views.py`, find the `payments_view` function and add type filtering. After the existing method filter logic, add:

```python
    type_filter = request.GET.get('type', '')
    if type_filter:
        payments = payments.filter(payment_type=type_filter)
```

Also add to the context:

```python
        'type_filter': type_filter,
```

And add type counts for the tabs:

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

- [ ] **Step 2: Add type filter tabs to payments.html**

After the stats section and before the filters card, add:

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
                    💰 Down Payments <span class="badge badge-info" style="margin-left:4px;">{{ type_counts.down_payment }}</span>
                </a>
                <a href="{% url 'payments' %}?type=installment{% if search %}&search={{ search }}{% endif %}" 
                   class="btn btn-sm {% if type_filter == 'installment' %}btn-primary{% else %}btn-ghost{% endif %}">
                    📅 Installments <span class="badge badge-info" style="margin-left:4px;">{{ type_counts.installment }}</span>
                </a>
                <a href="{% url 'payments' %}?type=full_payment{% if search %}&search={{ search }}{% endif %}" 
                   class="btn btn-sm {% if type_filter == 'full_payment' %}btn-primary{% else %}btn-ghost{% endif %}">
                    ✅ Full Payments <span class="badge badge-info" style="margin-left:4px;">{{ type_counts.full_payment }}</span>
                </a>
                <a href="{% url 'payments' %}?type=late_fee{% if search %}&search={{ search }}{% endif %}" 
                   class="btn btn-sm {% if type_filter == 'late_fee' %}btn-primary{% else %}btn-ghost{% endif %}">
                    ⚠️ Late Fees <span class="badge badge-info" style="margin-left:4px;">{{ type_counts.late_fee }}</span>
                </a>
                <a href="{% url 'payments' %}?type=other{% if search %}&search={{ search }}{% endif %}" 
                   class="btn btn-sm {% if type_filter == 'other' %}btn-primary{% else %}btn-ghost{% endif %}">
                    📝 Other <span class="badge badge-info" style="margin-left:4px;">{{ type_counts.other }}</span>
                </a>
            </div>
        </div>
```

- [ ] **Step 3: Verify system check passes**

Run: `venv\Scripts\python.exe manage.py check`
Expected: System check identified no issues (0 silenced)

- [ ] **Step 4: Commit**

```bash
git add core/views.py templates/payments.html
git commit -m "feat: add payment type filter tabs to payments list page"
```

---

### Task 9: Add Payment Type Column Enhancement

**Files:**
- Modify: `templates/payments.html` (payments table)

**Interfaces:**
- Consumes: `payment.payment_type`, `payment.get_payment_type_display()`

- [ ] **Step 1: Enhance type badge colors in payments table**

In `templates/payments.html`, find the existing type column:

```html
<td><span class="badge badge-secondary">{{ payment.get_payment_type_display }}</span></td>
```

Replace with color-coded badges:

```html
<td>
    <span class="badge {% if payment.payment_type == 'down_payment' %}badge-success{% elif payment.payment_type == 'installment' %}badge-info{% elif payment.payment_type == 'full_payment' %}badge-primary{% elif payment.payment_type == 'late_fee' %}badge-danger{% else %}badge-secondary{% endif %}">
        {{ payment.get_payment_type_display }}
    </span>
</td>
```

- [ ] **Step 2: Add type filter to URL preservation in filters**

In `templates/payments.html`, find the existing filter form and add hidden type field to preserve type filter:

```html
{% if type_filter %}
<input type="hidden" name="type" value="{{ type_filter }}">
{% endif %}
```

- [ ] **Step 3: Commit**

```bash
git add templates/payments.html
git commit -m "feat: enhance payment type badges with color coding"
```

---

### Task 10: Verify Complete Dashboard

**Files:**
- Verify: `core/views.py`, `templates/dashboard.html`, `templates/payments.html`

- [ ] **Step 1: Run system check**

Run: `venv\Scripts\python.exe manage.py check`
Expected: System check identified no issues (0 silenced)

- [ ] **Step 2: Test dashboard loads**

Run: `venv\Scripts\python.exe manage.py shell -c "from core.views import dashboard_view; print('Dashboard view imports OK')"`

- [ ] **Step 3: Test payments view loads**

Run: `venv\Scripts\python.exe manage.py shell -c "from core.views import payments_view; print('Payments view imports OK')"`

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete payment module improvements and dashboard redesign"
```
