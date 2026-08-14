# Task 6: Add Revenue by Payment Type and Collection Rate Charts

## Context
Add two new chart sections to the dashboard: Revenue by Payment Type (doughnut) and Collection Rate Trend (line).

## Files to Modify
- `templates/dashboard.html`

## What to Do
1. Add a new chart row BEFORE the "Payment Method & Revenue by Project" section
2. Add Chart.js initialization code for both charts in the script section

## Exact Changes Required

### 1. Add chart HTML section

Find the existing "Payment Method & Revenue by Project" section (look for `<!-- Payment Method & Revenue by Project -->`) and ADD this BEFORE it:

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

### 2. Add Chart.js code

In the `<script>` section at the bottom, add this AFTER the existing paymentMethodChart initialization (look for `paymentMethodChart` in the script):

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

## Verification
Run: `venv\Scripts\python.exe manage.py check`

## Commit
```bash
git add templates/dashboard.html
git commit -m "feat: add revenue by type doughnut and collection rate trend charts"
```
