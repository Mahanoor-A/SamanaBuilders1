# Payments Module Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the complete payment workflow with payment plans, installment schedules, dynamic payment method forms, file uploads, and enhanced dashboards.

**Architecture:** Extend existing backend models (PaymentAttachment, payment_type) with new serializers/endpoints; create missing Sidebar component; set up ERP routing; redesign all payment frontend pages; add Payment Plan tab to BookingDetailPage.

**Tech Stack:** Python Django + DRF (backend), React 18 + TailwindCSS 3 + lucide-react (frontend), Axios (API calls)

## Global Constraints

- Preserve all existing data — no destructive migrations
- Follow existing design system: `bg-surface rounded-2xl border border-border shadow-sm`, gradient buttons, floating label form pattern, `lucide-react` icons
- Maintain responsive UI with `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` layouts
- Use existing `DataTable`, `PageHeader`, `StatusBadge`, `Card`, `Button` components where possible
- All new fields on models must have sane defaults for existing rows
- No hardcoded values; reuse existing API endpoints where possible

---
### Task 1: Backend — PaymentAttachment Model + payment_type Field

**Files:**
- Modify: `payments/models.py`
- Modify: `payments/serializers.py`
- Create: `payments/migrations/XXXX_paymentattachment_payment_type.py`

**Interfaces:**
- Consumes: existing `Payment`, `User` models
- Produces: `PaymentAttachment` model, `payment_type` field on Payment, `PaymentAttachmentSerializer`

- [ ] **Step 1: Add PaymentAttachment model and payment_type to Payment model**

Edit `payments/models.py` — add `PAYMENT_TYPE_CHOICES` and `payment_type` field to Payment model, then add the `PaymentAttachment` model at the end of the file:

```python
# Add to Payment model, before save():
PAYMENT_TYPE_CHOICES = [
    ('down_payment', 'Down Payment'),
    ('installment', 'Installment'),
    ('full_payment', 'Full Payment'),
    ('other', 'Other'),
]
payment_type = models.CharField(max_length=20, choices=PAYMENT_TYPE_CHOICES, default='other')
```

Add at end of file (after Receipt model):

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

- [ ] **Step 2: Create migration**

```bash
python manage.py makemigrations payments
python manage.py migrate payments
```

- [ ] **Step 3: Add PaymentAttachmentSerializer to serializers.py**

Edit `payments/serializers.py` — add after the imports but before ReceiptSerializer:

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

Add `payment_type` and `payment_type_display` to `PaymentSerializer` fields list (after `payment_method_display`), and add `attachments` field:

```python
# In PaymentSerializer.Meta.fields, add after 'payment_method_display':
'payment_type', 'payment_type_display',
# And add before 'created_at':
'attachments',
```

Update `PaymentSerializer` to add `payment_type_display`:

```python
# Add in PaymentSerializer field definitions:
payment_type_display = serializers.CharField(source='get_payment_type_display', read_only=True)
```

Add `attachments` to `PaymentCreateSerializer` too — add `'payment_type'` after `'payment_method'` in fields.

Add `payment_type` and `attachments` to `PaymentDetailSerializer` similarly — add `payment_type_display` field and `attachments = PaymentAttachmentSerializer(many=True, read_only=True)`.

- [ ] **Step 4: Run tests that payments module loads**

```bash
python manage.py check
```

Expected: No errors.

---
### Task 2: Backend — Booking Payment-Summary Endpoint

**Files:**
- Modify: `bookings/api_views.py`
- Modify: `api/urls.py` (verify it's already registered)

**Interfaces:**
- Consumes: `Booking`, `InstallmentPlan`, `Installment`, `Payment` models
- Produces: `GET /api/bookings/{id}/payment-summary/` endpoint

- [ ] **Step 1: Add payment_summary action to BookingViewSet**

Edit `bookings/api_views.py` — add this import at top:

```python
from django.db.models import Sum
from payments.models import Payment
```

Add this action method to `BookingViewSet` class (after the `confirm` action):

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
        discount = BookingGroup.objects.filter(bookings=booking).first()
        discount = discount.discount_amount if discount else 0
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

- [ ] **Step 2: Verify endpoint works**

```bash
python manage.py check
```

The bookings ViewSet is already registered in `api/urls.py` so no URL changes needed.

---
### Task 3: Frontend — Create Sidebar Component

**Files:**
- Create: `frontend/src/components/erp/Sidebar.jsx`

**Interfaces:**
- Consumes: nothing from other tasks
- Produces: `Sidebar` component used by `Layout.jsx`

- [ ] **Step 1: Create Sidebar component**

```jsx
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, FileText, Building2, CreditCard,
  ClipboardList, Settings, ChevronLeft, Menu, LogOut,
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/erp' },
  { label: 'Customers', icon: Users, path: '/erp/customers' },
  { label: 'Bookings', icon: FileText, path: '/erp/bookings' },
  { label: 'Properties', icon: Building2, path: '/erp/properties' },
  { label: 'Payments', icon: CreditCard, path: '/erp/payments' },
  { label: 'Users', icon: ClipboardList, path: '/erp/users' },
  { label: 'Audit Logs', icon: ClipboardList, path: '/erp/audit-logs' },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`${
        collapsed ? 'w-16' : 'w-60'
      } bg-surface border-r border-border flex flex-col transition-all duration-300 shrink-0`}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-border">
        {!collapsed && (
          <span className="text-lg font-bold font-display text-text-main tracking-tight">
            Samana ERP
          </span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg hover:bg-border transition-colors text-text-muted"
        >
          {collapsed ? <Menu className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-primary/10 text-primary shadow-sm'
                  : 'text-text-muted hover:bg-primary/5 hover:text-text-main'
              }`}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-2 border-t border-border">
        <button
          onClick={() => navigate('/')}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-text-muted hover:bg-primary/5 hover:text-text-main transition-all duration-200"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!collapsed && <span>Exit ERP</span>}
        </button>
      </div>
    </aside>
  );
}
```

- [ ] **Step 2: Verify no import errors**

The `Layout.jsx` already imports `Sidebar` from `./Sidebar` — with this file created, it should work.

---
### Task 4: Frontend — ERP Router Setup

**Files:**
- Modify: `frontend/src/App.jsx`
- Modify: `frontend/src/main.jsx`

**Interfaces:**
- Consumes: all existing ERP page components
- Produces: fully functional routing for both corporate site and ERP

- [ ] **Step 1: Rewrite App.jsx with routing**

```jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import HomePage from './pages/HomePage';
import ErpLayout from './components/erp/Layout';
import DashboardPage from './pages/erp/DashboardPage';
import BookingsPage from './pages/erp/BookingsPage';
import BookingFormPage from './pages/erp/BookingFormPage';
import BookingDetailPage from './pages/erp/BookingDetailPage';
import PropertiesPage from './pages/erp/PropertiesPage';
import ProjectFormPage from './pages/erp/ProjectFormPage';
import PlotFormPage from './pages/erp/PlotFormPage';
import PaymentsPage from './pages/erp/PaymentsPage';
import PaymentFormPage from './pages/erp/PaymentFormPage';
import PaymentDetailPage from './pages/erp/PaymentDetailPage';
import UsersPage from './pages/erp/UsersPage';
import UserFormPage from './pages/erp/UserFormPage';
import AuditLogsPage from './pages/erp/AuditLogsPage';
import LoginPage from './pages/erp/LoginPage';

function CorporateLayout() {
  return (
    <div className="min-h-screen bg-bg">
      <Navbar />
      <main>
        <Routes>
          <Route index element={<HomePage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<CorporateLayout />} />
        <Route path="/erp/login" element={<LoginPage />} />
        <Route path="/erp" element={<ErpLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="bookings" element={<BookingsPage />} />
          <Route path="bookings/new" element={<BookingFormPage />} />
          <Route path="bookings/:id" element={<BookingDetailPage />} />
          <Route path="bookings/:id/edit" element={<BookingFormPage />} />
          <Route path="properties" element={<PropertiesPage />} />
          <Route path="properties/projects/new" element={<ProjectFormPage />} />
          <Route path="properties/projects/:id/edit" element={<ProjectFormPage />} />
          <Route path="properties/plots/new" element={<PlotFormPage />} />
          <Route path="properties/plots/:id/edit" element={<PlotFormPage />} />
          <Route path="payments" element={<PaymentsPage />} />
          <Route path="payments/new" element={<PaymentFormPage />} />
          <Route path="payments/:id" element={<PaymentDetailPage />} />
          <Route path="payments/:id/edit" element={<PaymentFormPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="users/new" element={<UserFormPage />} />
          <Route path="users/:id/edit" element={<UserFormPage />} />
          <Route path="audit-logs" element={<AuditLogsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
```

- [ ] **Step 2: Update main.jsx**

```jsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from './contexts/ThemeContext';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>
);
```

(main.jsx stays the same — only App.jsx changes)

- [ ] **Step 3: Verify the dev server starts**

```bash
cd frontend
npm run dev
```

If there are missing page imports (like BookingsPage, UsersPage, etc.), they already exist — verify they all exist in `frontend/src/pages/erp/`. If any are missing, they will cause build errors. Address any missing imports.

---
### Task 5: Frontend — Shared Utility Components

**Files:**
- Create: `frontend/src/components/erp/FileUpload.jsx`
- Create: `frontend/src/components/erp/PaymentSummaryCard.jsx`
- Create: `frontend/src/components/erp/InstallmentSchedule.jsx`
- Create: `frontend/src/components/erp/PaymentProgressBar.jsx`
- Modify: `frontend/src/services/api.js`

- [ ] **Step 1: Create FileUpload component**

```jsx
import React, { useState, useRef } from 'react';
import { Upload, X, File, Image } from 'lucide-react';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export default function FileUpload({ onFilesChange, multiple = false, maxFiles = 1 }) {
  const [files, setFiles] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  const handleFiles = (newFiles) => {
    const valid = Array.from(newFiles).filter((f) => {
      if (!ACCEPTED_TYPES.includes(f.type)) return false;
      if (f.size > MAX_SIZE) return false;
      return true;
    });

    const updated = multiple ? [...files, ...valid].slice(0, maxFiles) : [valid[0]].filter(Boolean);
    setFiles(updated);
    onFilesChange?.(updated);
  };

  const removeFile = (index) => {
    const updated = files.filter((_, i) => i !== index);
    setFiles(updated);
    onFilesChange?.(updated);
  };

  const isImage = (file) => file.type.startsWith('image/');

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 ${
          dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30 hover:bg-primary/3'
        }`}
      >
        <Upload className="w-8 h-8 text-text-muted mx-auto mb-2" />
        <p className="text-sm text-text-muted">Drop files here or click to browse</p>
        <p className="text-xs text-text-muted/60 mt-1">JPG, PNG, WEBP, PDF up to 5MB</p>
        <input
          ref={inputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp,.pdf"
          multiple={multiple}
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />
      </div>

      {files.length > 0 && (
        <div className="mt-3 space-y-2">
          {files.map((file, i) => (
            <div key={i} className="flex items-center gap-3 p-2 bg-bg rounded-lg border border-border">
              {isImage(file) ? (
                <img src={URL.createObjectURL(file)} alt="" className="w-10 h-10 rounded object-cover" />
              ) : (
                <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center">
                  <File className="w-5 h-5 text-primary" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-text-main truncate">{file.name}</p>
                <p className="text-xs text-text-muted">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
              <button onClick={() => removeFile(i)} className="p-1 hover:bg-border rounded-lg transition-colors">
                <X className="w-4 h-4 text-text-muted" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create PaymentSummaryCard component**

```jsx
import React from 'react';
import { DollarSign, Percent, BadgePercent, ArrowDownToLine, Calendar } from 'lucide-react';

export default function PaymentSummaryCard({ propertyPrice, discount, finalPrice, downPayment, remainingAmount, monthlyInstallment, totalPaid, progressPercent }) {
  const items = [
    { label: 'Property Price', value: propertyPrice, icon: DollarSign, highlight: false },
    { label: 'Discount', value: discount, icon: BadgePercent, highlight: false, negative: true },
    { label: 'Final Sale Price', value: finalPrice, icon: DollarSign, highlight: true },
    { label: 'Down Payment', value: downPayment, icon: ArrowDownToLine, highlight: false },
    { label: 'Remaining Amount', value: remainingAmount, icon: DollarSign, highlight: true },
  ];

  if (monthlyInstallment) {
    items.push({ label: 'Monthly Installment', value: monthlyInstallment, icon: Calendar, highlight: true });
  }
  if (totalPaid !== undefined) {
    items.push({ label: 'Total Paid', value: totalPaid, icon: DollarSign, highlight: false, accent: true });
  }

  return (
    <div className="bg-surface rounded-2xl border border-border shadow-sm p-5">
      <h3 className="text-sm font-semibold text-text-main font-display mb-4">Payment Summary</h3>
      <div className="space-y-3">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className={`flex items-center justify-between p-2.5 rounded-xl ${
                item.highlight ? 'bg-primary/5 border border-primary/10' : ''
              } ${item.accent ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/30' : ''}`}
            >
              <div className="flex items-center gap-2">
                <Icon className={`w-4 h-4 ${item.highlight ? 'text-primary' : item.accent ? 'text-emerald-600' : 'text-text-muted'}`} />
                <span className={`text-sm ${item.highlight ? 'font-semibold text-text-main' : 'text-text-muted'}`}>
                  {item.label}
                </span>
              </div>
              <span className={`text-sm font-medium ${
                item.negative ? 'text-red-500' : item.accent ? 'text-emerald-600' : 'text-text-main'
              }`}>
                {item.value != null ? `PKR ${Number(item.value).toLocaleString()}` : '—'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create InstallmentSchedule component**

```jsx
import React from 'react';
import { Calendar, DollarSign } from 'lucide-react';
import StatusBadge from './StatusBadge';

export default function InstallmentSchedule({ installments = [], onReceivePayment }) {
  if (installments.length === 0) {
    return (
      <div className="text-center py-8 text-text-muted text-sm">
        No installments scheduled yet.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase">#</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase">Due Date</th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-text-muted uppercase">Amount</th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-text-muted uppercase">Late Fee</th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-text-muted uppercase">Paid</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase">Status</th>
            {onReceivePayment && <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase">Action</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/50">
          {installments.map((inst) => {
            const remaining = (Number(inst.amount) + Number(inst.late_fee || 0)) - Number(inst.paid_amount || 0);
            return (
              <tr key={inst.installment_number || inst.id} className="hover:bg-bg/50 transition-colors">
                <td className="px-4 py-3 text-sm font-medium text-text-main">{inst.installment_number}</td>
                <td className="px-4 py-3 text-sm text-text-muted">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    {inst.due_date ? new Date(inst.due_date).toLocaleDateString() : '-'}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm font-medium text-text-main text-right">
                  PKR {Number(inst.amount).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-sm text-text-muted text-right">
                  {Number(inst.late_fee || 0) > 0 ? `PKR ${Number(inst.late_fee).toLocaleString()}` : '-'}
                </td>
                <td className="px-4 py-3 text-sm text-text-muted text-right">
                  {Number(inst.paid_amount || 0) > 0 ? `PKR ${Number(inst.paid_amount).toLocaleString()}` : '-'}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={inst.status || 'pending'} />
                </td>
                {onReceivePayment && (
                  <td className="px-4 py-3">
                    {inst.status !== 'paid' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onReceivePayment(inst); }}
                        className="text-xs font-medium text-primary hover:text-primary-light transition-colors"
                      >
                        Receive Payment
                      </button>
                    )}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 4: Create PaymentProgressBar component**

```jsx
import React from 'react';

export default function PaymentProgressBar({ percent = 0, showLabel = true, size = 'md' }) {
  const heights = { sm: 'h-1.5', md: 'h-2.5', lg: 'h-4' };
  const color =
    percent >= 80 ? 'from-emerald-500 to-emerald-600' :
    percent >= 50 ? 'from-amber-500 to-amber-600' :
    'from-primary to-primary-light';

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-sm font-medium text-text-main">Payment Progress</span>
          <span className="text-sm font-bold text-text-main">{percent}%</span>
        </div>
      )}
      <div className={`w-full ${heights[size]} rounded-full bg-primary/5 overflow-hidden`}>
        <div
          className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-700 ease-out`}
          style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Add paymentAPI service helpers to api.js**

Edit `frontend/src/services/api.js` — add before `export default api`:

```js
export const paymentAPI = {
  getAll: (params) => api.get('/payments/', { params }),
  getById: (id) => api.get(`/payments/${id}/`),
  create: (data) => api.post('/payments/', data),
  update: (id, data) => api.put(`/payments/${id}/`, data),
  verify: (id, data) => api.post(`/payments/${id}/verify/`, data),
  markBounced: (id, data) => api.post(`/payments/${id}/mark_bounced/`, data),
  delete: (id) => api.delete(`/payments/${id}/`),
  getAttachments: (paymentId) => api.get(`/payments/${paymentId}/attachments/`),
};

export const bookingPaymentAPI = {
  getPaymentSummary: (bookingId) => api.get(`/bookings/${bookingId}/payment-summary/`),
};
```

---
### Task 6: Frontend — PaymentsPage Redesign

**Files:**
- Rewrite: `frontend/src/pages/erp/PaymentsPage.jsx`

**Interfaces:**
- Consumes: `paymentAPI.getAll()`, `DataTable`, `PageHeader`, `StatusBadge`, `StatCard`
- Produces: Enhanced payments list page with stat cards and full columns

- [ ] **Step 1: Rewrite PaymentsPage.jsx**

```jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, CreditCard, DollarSign, FileText, User, Wallet, AlertTriangle, Calendar, TrendingUp, MoreVertical, CheckCircle2, XCircle, Eye, Pencil, Trash2 } from 'lucide-react';
import api, { paymentAPI } from '../../services/api';
import DataTable from '../../components/erp/DataTable';
import PageHeader from '../../components/erp/PageHeader';
import SearchInput from '../../components/erp/SearchInput';
import StatusBadge from '../../components/erp/StatusBadge';
import StatCard from '../../components/erp/StatCard';
import ConfirmModal from '../../components/erp/ConfirmModal';
import { toast } from '../../utils/toast';

export default function PaymentsPage() {
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [deleteModal, setDeleteModal] = useState(null);
  const [stats, setStats] = useState({ total: 0, collected: 0, outstanding: 0, overdue: 0, today: 0 });

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (methodFilter) params.method = methodFilter;
      const { data } = await api.get('/payments/', { params });
      const list = Array.isArray(data) ? data : data.results ?? [];
      setPayments(list);

      const totalCollected = list.filter(p => p.status === 'verified').reduce((s, p) => s + Number(p.amount || 0), 0);
      const todayStr = new Date().toISOString().split('T')[0];
      const todayCollected = list.filter(p => p.payment_date === todayStr).reduce((s, p) => s + Number(p.amount || 0), 0);
      setStats({
        total: list.length,
        collected: totalCollected,
        outstanding: list.filter(p => p.status === 'pending').reduce((s, p) => s + Number(p.amount || 0), 0),
        overdue: list.filter(p => p.status === 'overdue' || p.status === 'bounced').length,
        today: todayCollected,
      });
    } catch { toast.error('Failed to load payments'); }
    finally { setLoading(false); }
  }, [statusFilter, methodFilter]);

  useEffect(() => { fetch(); }, [fetch]);

  const handleDelete = async () => {
    if (!deleteModal) return;
    try {
      await api.delete(`/payments/${deleteModal.id}/`);
      toast.success('Payment deleted');
      setDeleteModal(null);
      fetch();
    } catch { toast.error('Failed to delete payment'); }
  };

  const filtered = payments.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (p.payment_id || '').toLowerCase().includes(q) ||
      (p.customer_name || '').toLowerCase().includes(q) ||
      (p.booking_id_display || '').toLowerCase().includes(q)
    );
  });

  const statuses = ['', 'pending', 'verified', 'rejected', 'bounced'];
  const methods = ['', 'cash', 'cheque', 'bank_transfer', 'online', 'jazzcash', 'easypaisa', 'raast'];

  const columns = [
    {
      header: 'Payment ID',
      accessor: 'payment_id',
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white">
            <DollarSign className="w-4 h-4" />
          </div>
          <div>
            <p className="font-medium text-text-main">{row.payment_id || `#${row.id}`}</p>
            <p className="text-xs text-text-muted">{row.payment_date ? new Date(row.payment_date).toLocaleDateString() : '-'}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Booking',
      accessor: 'booking_id_display',
      cell: (row) => (
        <span className="text-sm flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-text-muted" />
          {row.booking_id_display || '-'}
        </span>
      ),
    },
    {
      header: 'Customer',
      accessor: 'customer_name',
      cell: (row) => (
        <span className="text-sm flex items-center gap-1.5">
          <User className="w-3.5 h-3.5 text-text-muted" />
          {row.customer_name || '-'}
        </span>
      ),
    },
    {
      header: 'Type',
      accessor: 'payment_type',
      cell: (row) => (
        <span className="text-xs font-medium px-2 py-1 rounded-lg bg-primary/10 text-primary">
          {row.payment_type_display || (row.payment_type ? row.payment_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Other')}
        </span>
      ),
    },
    {
      header: 'Amount',
      accessor: 'amount',
      cell: (row) => (
        <span className="text-sm font-medium text-text-main">
          PKR {Number(row.amount || 0).toLocaleString()}
        </span>
      ),
    },
    {
      header: 'Method',
      accessor: 'payment_method_display',
      cell: (row) => (
        <span className="text-sm text-text-muted">{row.payment_method_display || row.payment_method || '-'}</span>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      cell: (row) => <StatusBadge status={row.status || 'pending'} />,
    },
    {
      header: 'Verified By',
      accessor: 'verified_by_name',
      cell: (row) => <span className="text-sm text-text-muted">{row.verified_by_name || '-'}</span>,
    },
    {
      header: 'Actions',
      accessor: 'actions',
      sortable: false,
      cell: (row) => (
        <div className="flex items-center gap-1">
          <button onClick={(e) => { e.stopPropagation(); navigate(`/erp/payments/${row.id}`); }}
            className="p-1.5 rounded-lg hover:bg-primary/10 text-text-muted hover:text-primary transition-colors" title="View">
            <Eye className="w-4 h-4" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); navigate(`/erp/payments/${row.id}/edit`); }}
            className="p-1.5 rounded-lg hover:bg-amber-500/10 text-text-muted hover:text-amber-600 transition-colors" title="Edit">
            <Pencil className="w-4 h-4" />
          </button>
          {row.status === 'pending' && (
            <button onClick={(e) => { e.stopPropagation(); navigate(`/erp/payments/${row.id}`); }}
              className="p-1.5 rounded-lg hover:bg-emerald-500/10 text-text-muted hover:text-emerald-600 transition-colors" title="Verify">
              <CheckCircle2 className="w-4 h-4" />
            </button>
          )}
          <button onClick={(e) => { e.stopPropagation(); setDeleteModal(row); }}
            className="p-1.5 rounded-lg hover:bg-red-500/10 text-text-muted hover:text-red-500 transition-colors" title="Delete">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Payments"
        subtitle="Manage payment records"
        breadcrumbs={[{ label: 'ERP' }, { label: 'Payments' }]}
        actions={
          <button
            onClick={() => navigate('/erp/payments/new')}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary to-primary-light text-white text-sm font-medium rounded-xl hover:shadow-lg hover:shadow-primary/25 transition-all duration-300"
          >
            <Plus className="w-4 h-4" /> Record Payment
          </button>
        }
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Collected" value={`PKR ${stats.collected.toLocaleString()}`} icon={Wallet} color="emerald" />
        <StatCard title="Outstanding" value={`PKR ${stats.outstanding.toLocaleString()}`} icon={TrendingUp} color="amber" />
        <StatCard title="Overdue" value={stats.overdue.toString()} icon={AlertTriangle} color="rose" />
        <StatCard title="Today's Collections" value={`PKR ${stats.today.toLocaleString()}`} icon={Calendar} color="sky" />
      </div>

      {/* Filters */}
      <div className="bg-surface rounded-2xl border border-border shadow-sm mb-6 p-4 animate-fade-in-up">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by ID, customer, booking..." className="w-full sm:w-72" />
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-text-muted">Status:</span>
            {statuses.map((s) => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  statusFilter === s ? 'bg-primary text-white' : 'bg-bg text-text-muted hover:bg-border'
                }`}
              >
                {s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All'}
              </button>
            ))}
          </div>
          <select value={methodFilter} onChange={(e) => setMethodFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-bg border border-border text-text-muted focus:outline-none focus:border-primary">
            <option value="">All Methods</option>
            {methods.filter(Boolean).map((m) => (
              <option key={m} value={m}>{m.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>
            ))}
          </select>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        loading={loading}
        searchable={false}
        emptyMessage="No payments found"
        emptyIcon={CreditCard}
        onRowClick={(row) => navigate(`/erp/payments/${row.id}`)}
      />

      <ConfirmModal
        isOpen={!!deleteModal}
        onClose={() => setDeleteModal(null)}
        onConfirm={handleDelete}
        title="Delete Payment"
        message={`Are you sure you want to delete payment ${deleteModal?.payment_id || ''}? This action cannot be undone.`}
        confirmText="Delete"
      />
    </div>
  );
}
```

---
### Task 7: Frontend — PaymentFormPage Redesign

**Files:**
- Rewrite: `frontend/src/pages/erp/PaymentFormPage.jsx`

**Interfaces:**
- Consumes: `paymentAPI.create()`, `paymentAPI.update()`, `bookingPaymentAPI.getPaymentSummary()`
- Produces: Redesigned payment form with dynamic method fields, payment summary, and file uploads

- [ ] **Step 1: Rewrite PaymentFormPage.jsx**

```jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, DollarSign, CreditCard, FileText, Upload, Building2, Banknote, Smartphone, Hash, Calendar, User, Phone, Image, Landmark, Shield } from 'lucide-react';
import api from '../../services/api';
import PageHeader from '../../components/erp/PageHeader';
import FileUpload from '../../components/erp/FileUpload';
import PaymentSummaryCard from '../../components/erp/PaymentSummaryCard';
import { toast } from '../../utils/toast';

const PAYMENT_TYPES = [
  { value: 'down_payment', label: 'Down Payment' },
  { value: 'installment', label: 'Installment' },
  { value: 'full_payment', label: 'Full Remaining Amount' },
  { value: 'other', label: 'Other' },
];

const METHOD_FIELDS = {
  cash: {
    label: 'Cash',
    icon: Banknote,
    fields: ['received_by', 'receipt_number'],
  },
  cheque: {
    label: 'Cheque',
    icon: FileText,
    fields: ['cheque_number', 'cheque_amount', 'cheque_date', 'issue_date', 'bank_name', 'branch_name', 'account_holder', 'cheque_image'],
  },
  bank_transfer: {
    label: 'Bank Transfer',
    icon: Building2,
    fields: ['customer_bank', 'customer_account_no', 'transaction_id', 'reference_number', 'transfer_date', 'company_bank', 'company_account', 'paid_to', 'screenshot'],
  },
  online: {
    label: 'Online Banking',
    icon: Smartphone,
    fields: ['online_bank', 'reference_number', 'transaction_id', 'transfer_date', 'screenshot'],
  },
  easypaisa: {
    label: 'EasyPaisa',
    icon: Smartphone,
    fields: ['sender_name', 'sender_phone', 'transaction_id', 'transfer_date', 'company_account_no', 'screenshot'],
  },
  jazzcash: {
    label: 'JazzCash',
    icon: Smartphone,
    fields: ['sender_name', 'sender_phone', 'transaction_id', 'transfer_date', 'company_account_no', 'screenshot'],
  },
  raast: {
    label: 'Raast Transfer',
    icon: Landmark,
    fields: ['sender_iban', 'transaction_id', 'reference_number', 'transfer_date', 'company_account', 'screenshot'],
  },
};

export default function PaymentFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isEdit = Boolean(id);
  const prefillBooking = searchParams.get('booking');
  const prefillInstallment = searchParams.get('installment');

  const [form, setForm] = useState({
    booking: prefillBooking || '',
    payment_type: prefillBooking ? 'down_payment' : 'other',
    installment: prefillInstallment || '',
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'cash',
    reference_number: '',
    notes: '',
    // Dynamic method fields
    received_by: '',
    receipt_number: '',
    cheque_number: '',
    cheque_amount: '',
    cheque_date: '',
    issue_date: '',
    bank_name: '',
    branch_name: '',
    account_holder: '',
    customer_bank: '',
    customer_account_no: '',
    transaction_id: '',
    transfer_date: '',
    company_bank: '',
    company_account: '',
    company_account_no: '',
    paid_to: '',
    online_bank: '',
    sender_name: '',
    sender_phone: '',
    sender_iban: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [bookings, setBookings] = useState([]);
  const [bookingSummary, setBookingSummary] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [installments, setInstallments] = useState([]);

  // Fetch bookings list
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/bookings/');
        setBookings(Array.isArray(data) ? data : data.results ?? []);
      } catch { /* ignore */ }
    })();
  }, []);

  // Fetch booking summary when booking changes
  useEffect(() => {
    if (!form.booking) { setBookingSummary(null); setInstallments([]); return; }
    (async () => {
      try {
        const { data } = await api.get(`/bookings/${form.booking}/payment-summary/`);
        setBookingSummary(data);
        setInstallments(data.installments || []);
        // Auto-fill down payment amount
        if (form.payment_type === 'down_payment' && !form.amount) {
          setForm(prev => ({ ...prev, amount: data.down_payment }));
        }
      } catch { /* ignore */ }
    })();
  }, [form.booking, form.payment_type]);

  // Auto-fill amount when installment changes
  useEffect(() => {
    if (form.payment_type === 'installment' && form.installment) {
      const inst = installments.find(i => String(i.id) === String(form.installment) || String(i.installment_number) === String(form.installment));
      if (inst) {
        const remaining = Number(inst.amount) - Number(inst.paid_amount || 0);
        setForm(prev => ({ ...prev, amount: remaining > 0 ? remaining : inst.amount }));
      }
    }
  }, [form.installment, form.payment_type, installments]);

  // Auto-set amount for full payment
  useEffect(() => {
    if (form.payment_type === 'full_payment' && bookingSummary) {
      setForm(prev => ({ ...prev, amount: bookingSummary.outstanding }));
    }
  }, [form.payment_type, bookingSummary]);

  // Load payment if editing
  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      try {
        setFetching(true);
        const { data } = await api.get(`/payments/${id}/`);
        setForm(prev => ({
          ...prev,
          booking: data.booking || '',
          payment_type: data.payment_type || 'other',
          installment: data.installment || '',
          amount: data.amount ?? '',
          payment_date: data.payment_date?.split('T')[0] || '',
          payment_method: data.payment_method || 'cash',
          reference_number: data.reference_number || '',
          notes: data.notes || '',
        }));
      } catch {
        toast.error('Failed to load payment');
        navigate('/erp/payments');
      } finally {
        setFetching(false);
      }
    })();
  }, [id, isEdit, navigate]);

  const validate = () => {
    const errs = {};
    if (!form.booking) errs.booking = 'Booking is required';
    if (!form.amount || Number(form.amount) <= 0) errs.amount = 'Valid amount is required';
    if (!form.payment_date) errs.payment_date = 'Payment date is required';
    if (form.payment_method === 'cheque') {
      if (!form.cheque_number) errs.cheque_number = 'Cheque number required';
      if (!form.bank_name) errs.bank_name = 'Bank name required';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      setLoading(true);
      const payload = {
        booking: Number(form.booking),
        payment_type: form.payment_type,
        amount: Number(form.amount),
        payment_date: form.payment_date,
        payment_method: form.payment_method,
        reference_number: form.reference_number,
        notes: form.notes,
      };

      if (form.payment_method === 'cheque') {
        payload.cheque_number = form.cheque_number;
        payload.bank_name = form.bank_name;
        payload.cheque_date = form.cheque_date;
        payload.cheque_amount = form.cheque_amount;
      }

      if (form.installment && form.payment_type === 'installment') {
        payload.installment = Number(form.installment);
      }

      if (isEdit) {
        await api.put(`/payments/${id}/`, payload);
        toast.success('Payment updated');
      } else {
        await api.post('/payments/', payload);
        toast.success('Payment recorded');
      }
      navigate('/erp/payments');
    } catch (err) {
      const detail = err.response?.data;
      if (typeof detail === 'object' && detail) {
        const fieldErrors = {};
        Object.entries(detail).forEach(([key, msgs]) => {
          fieldErrors[key] = Array.isArray(msgs) ? msgs.join(', ') : msgs;
        });
        setErrors(fieldErrors);
      }
      toast.error(`Failed to ${isEdit ? 'update' : 'record'} payment`);
    } finally {
      setLoading(false);
    }
  };

  const methodConfig = METHOD_FIELDS[form.payment_method] || METHOD_FIELDS.cash;
  const MethodIcon = methodConfig.icon;

  if (fetching) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  const renderField = (fieldName) => {
    const fieldMeta = {
      received_by: { label: 'Received By', type: 'text', colSpan: 1, required: false },
      receipt_number: { label: 'Receipt Number', type: 'text', colSpan: 1, required: false },
      cheque_number: { label: 'Cheque Number', type: 'text', colSpan: 1, required: true },
      cheque_amount: { label: 'Cheque Amount (PKR)', type: 'number', colSpan: 1, required: false },
      cheque_date: { label: 'Cheque Date', type: 'date', colSpan: 1, required: false },
      issue_date: { label: 'Issue Date', type: 'date', colSpan: 1, required: false },
      bank_name: { label: 'Bank Name', type: 'text', colSpan: 1, required: true },
      branch_name: { label: 'Branch Name', type: 'text', colSpan: 1, required: false },
      account_holder: { label: 'Account Holder Name', type: 'text', colSpan: 1, required: false },
      cheque_image: { label: 'Cheque Image', type: 'file', colSpan: 2, required: false },
      customer_bank: { label: 'Customer Bank', type: 'text', colSpan: 1, required: false },
      customer_account_no: { label: 'Customer Account Number', type: 'text', colSpan: 1, required: false },
      transaction_id: { label: 'Transaction ID', type: 'text', colSpan: 1, required: false },
      reference_number: { label: 'Reference Number', type: 'text', colSpan: 1, required: false },
      transfer_date: { label: 'Transfer Date', type: 'date', colSpan: 1, required: false },
      company_bank: { label: 'Company Bank', type: 'text', colSpan: 1, required: false },
      company_account: { label: 'Company Account', type: 'text', colSpan: 1, required: false },
      paid_to: { label: 'Paid To', type: 'text', colSpan: 1, required: false },
      screenshot: { label: 'Payment Screenshot', type: 'file', colSpan: 2, required: false },
      online_bank: { label: 'Bank', type: 'text', colSpan: 1, required: false },
      sender_name: { label: 'Sender Name', type: 'text', colSpan: 1, required: false },
      sender_phone: { label: 'Sender Phone', type: 'text', colSpan: 1, required: false },
      sender_iban: { label: 'Sender IBAN', type: 'text', colSpan: 1, required: false },
      company_account_no: { label: 'Company Account Number', type: 'text', colSpan: 1, required: false },
    };

    const meta = fieldMeta[fieldName];
    if (!meta) return null;

    if (meta.type === 'file') {
      return (
        <div key={fieldName} className="col-span-full">
          <label className="block text-xs font-medium text-text-muted mb-1.5">{meta.label}</label>
          <FileUpload onFilesChange={(files) => setUploadedFiles(files)} />
        </div>
      );
    }

    return (
      <div key={fieldName} className={meta.colSpan === 2 ? 'md:col-span-2' : ''}>
        <div className="relative">
          <input
            type={meta.type}
            name={fieldName}
            value={form[fieldName] || ''}
            onChange={handleChange}
            placeholder=" "
            step={meta.type === 'number' ? '0.01' : undefined}
            className={`peer w-full px-4 pt-6 pb-2 bg-bg border rounded-xl text-sm text-text-main placeholder-transparent focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 ${
              errors[fieldName] ? 'border-red-400' : 'border-border focus:border-primary'
            }`}
          />
          <label className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-text-muted/70 peer-focus:top-2 peer-focus:text-xs peer-focus:text-primary peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-text-muted transition-all duration-200">
            {meta.label} {meta.required && <span className="text-red-400">*</span>}
          </label>
        </div>
        {errors[fieldName] && <p className="text-xs text-red-500 mt-1.5 ml-1">{errors[fieldName]}</p>}
      </div>
    );
  };

  return (
    <div>
      <PageHeader
        title={isEdit ? 'Edit Payment' : 'Record Payment'}
        breadcrumbs={[
          { label: 'ERP', to: '/erp' },
          { label: 'Payments', to: '/erp/payments' },
          { label: isEdit ? 'Edit' : 'New' },
        ]}
      />

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column — Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Card 1: Payment Summary */}
            <div className="bg-surface rounded-2xl border border-border shadow-sm animate-fade-in-up">
              <div className="p-5 border-b border-border">
                <h3 className="text-sm font-semibold text-text-main font-display flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-primary" /> Payment Summary
                </h3>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Payment Type */}
                  <div>
                    <div className="relative">
                      <select name="payment_type" value={form.payment_type} onChange={handleChange}
                        className="w-full px-4 pt-6 pb-2 bg-bg border border-border rounded-xl text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 appearance-none">
                        {PAYMENT_TYPES.map((t) => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </select>
                      <label className="absolute left-4 top-2 text-xs text-primary">Payment Type</label>
                    </div>
                  </div>

                  {/* Booking */}
                  <div>
                    <div className="relative">
                      <select name="booking" value={form.booking} onChange={handleChange}
                        className={`w-full px-4 pt-6 pb-2 bg-bg border rounded-xl text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 appearance-none ${
                          errors.booking ? 'border-red-400' : 'border-border focus:border-primary'
                        }`}>
                        <option value="">Select booking</option>
                        {bookings.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.booking_id || `#${b.id}`} - {b.customer_name || ''}
                          </option>
                        ))}
                      </select>
                      <label className="absolute left-4 top-2 text-xs text-primary flex items-center gap-1.5">
                        <FileText className="w-3 h-3" /> Booking <span className="text-red-400">*</span>
                      </label>
                    </div>
                    {errors.booking && <p className="text-xs text-red-500 mt-1.5 ml-1">{errors.booking}</p>}
                  </div>

                  {/* Installment selector (visible when type = installment) */}
                  {form.payment_type === 'installment' && (
                    <div>
                      <div className="relative">
                        <select name="installment" value={form.installment} onChange={handleChange}
                          className="w-full px-4 pt-6 pb-2 bg-bg border border-border rounded-xl text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 appearance-none">
                          <option value="">Select installment</option>
                          {installments.filter(i => i.status !== 'paid').map((inst) => (
                            <option key={inst.id || inst.installment_number} value={inst.id || inst.installment_number}>
                              Installment #{inst.installment_number} — PKR {Number(inst.amount).toLocaleString()} ({inst.status})
                            </option>
                          ))}
                        </select>
                        <label className="absolute left-4 top-2 text-xs text-primary">Installment</label>
                      </div>
                    </div>
                  )}

                  {/* Amount */}
                  <div>
                    <div className="relative">
                      <input type="number" name="amount" value={form.amount} onChange={handleChange} placeholder=" " min="0" step="0.01"
                        className={`peer w-full px-4 pt-6 pb-2 bg-bg border rounded-xl text-sm text-text-main placeholder-transparent focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 ${
                          errors.amount ? 'border-red-400' : 'border-border focus:border-primary'
                        }`}
                      />
                      <label className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-text-muted/70 peer-focus:top-2 peer-focus:text-xs peer-focus:text-primary peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-text-muted transition-all duration-200">
                        Amount (PKR) <span className="text-red-400">*</span>
                      </label>
                    </div>
                    {errors.amount && <p className="text-xs text-red-500 mt-1.5 ml-1">{errors.amount}</p>}
                  </div>

                  {/* Payment Date */}
                  <div>
                    <div className="relative">
                      <input type="date" name="payment_date" value={form.payment_date} onChange={handleChange} placeholder=" "
                        className={`peer w-full px-4 pt-6 pb-2 bg-bg border rounded-xl text-sm text-text-main placeholder-transparent focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 ${
                          errors.payment_date ? 'border-red-400' : 'border-border focus:border-primary'
                        }`}
                      />
                      <label className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-text-muted/70 peer-focus:top-2 peer-focus:text-xs peer-focus:text-primary peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-text-muted transition-all duration-200">
                        Payment Date <span className="text-red-400">*</span>
                      </label>
                    </div>
                    {errors.payment_date && <p className="text-xs text-red-500 mt-1.5 ml-1">{errors.payment_date}</p>}
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Payment Method */}
            <div className="bg-surface rounded-2xl border border-border shadow-sm animate-fade-in-up">
              <div className="p-5 border-b border-border">
                <h3 className="text-sm font-semibold text-text-main font-display flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-primary" /> Payment Method
                </h3>
              </div>
              <div className="p-5">
                <div className="mb-5">
                  <div className="flex items-center gap-2 flex-wrap">
                    {Object.entries(METHOD_FIELDS).map(([key, config]) => {
                      const Icon = config.icon;
                      return (
                        <button key={key} type="button" onClick={() => setForm(prev => ({ ...prev, payment_method: key }))}
                          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all duration-200 border ${
                            form.payment_method === key
                              ? 'bg-primary text-white border-primary shadow-sm'
                              : 'bg-bg text-text-muted border-border hover:border-primary/30 hover:text-text-main'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          {config.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {methodConfig.fields.map(renderField)}
                </div>
              </div>
            </div>

            {/* Card 3: Notes */}
            <div className="bg-surface rounded-2xl border border-border shadow-sm animate-fade-in-up">
              <div className="p-5 border-b border-border">
                <h3 className="text-sm font-semibold text-text-main font-display flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" /> Notes & Attachments
                </h3>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <div className="relative">
                    <textarea name="notes" value={form.notes} onChange={handleChange} placeholder=" " rows={2}
                      className="peer w-full px-4 pt-6 pb-2 bg-bg border border-border rounded-xl text-sm text-text-main placeholder-transparent focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 resize-none"
                    />
                    <label className="absolute left-4 top-4 text-sm text-text-muted/70 peer-focus:top-2 peer-focus:text-xs peer-focus:text-primary peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-text-muted transition-all duration-200">
                      Notes
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column — Payment Summary Card */}
          <div className="space-y-6 animate-fade-in-up">
            {bookingSummary && (
              <PaymentSummaryCard
                propertyPrice={bookingSummary.property_price}
                discount={bookingSummary.discount}
                finalPrice={bookingSummary.final_price}
                downPayment={bookingSummary.down_payment}
                remainingAmount={bookingSummary.remaining_amount}
                monthlyInstallment={bookingSummary.installment_amount}
                totalPaid={bookingSummary.total_paid}
                progressPercent={bookingSummary.progress_percent}
              />
            )}
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-border">
          <button type="button" onClick={() => navigate('/erp/payments')}
            className="px-5 py-2.5 text-sm font-medium text-text-main bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={loading}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-primary to-primary-light rounded-xl hover:shadow-lg hover:shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isEdit ? 'Update Payment' : 'Record Payment'}
          </button>
        </div>
      </form>
    </div>
  );
}
```

---
### Task 8: Frontend — PaymentDetailPage (New Page)

**Files:**
- Create: `frontend/src/pages/erp/PaymentDetailPage.jsx`

**Interfaces:**
- Consumes: `paymentAPI.getById()`, `paymentAPI.verify()`, `StatusBadge`, `PageHeader`
- Produces: Full payment detail view with verification workflow

- [ ] **Step 1: Create PaymentDetailPage.jsx**

```jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, XCircle, Loader2, DollarSign, FileText, User, Calendar, CreditCard, Building2, Download, Pencil, Trash2, Clock, Shield, AlertTriangle } from 'lucide-react';
import api from '../../services/api';
import PageHeader from '../../components/erp/PageHeader';
import StatusBadge from '../../components/erp/StatusBadge';
import PaymentProgressBar from '../../components/erp/PaymentProgressBar';
import ConfirmModal from '../../components/erp/ConfirmModal';
import { toast } from '../../utils/toast';

export default function PaymentDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [rejectNotes, setRejectNotes] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/payments/${id}/`);
        setPayment(data);
      } catch {
        toast.error('Failed to load payment');
        navigate('/erp/payments');
      } finally {
        setLoading(false);
      }
    })();
  }, [id, navigate]);

  const handleVerify = async () => {
    try {
      setVerifying(true);
      await api.post(`/payments/${id}/verify/`, { action: 'verify' });
      toast.success('Payment verified successfully');
      const { data } = await api.get(`/payments/${id}/`);
      setPayment(data);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to verify payment');
    } finally {
      setVerifying(false);
    }
  };

  const handleReject = async () => {
    try {
      setVerifying(true);
      await api.post(`/payments/${id}/verify/`, { action: 'reject', notes: rejectNotes });
      toast.success('Payment rejected');
      const { data } = await api.get(`/payments/${id}/`);
      setPayment(data);
      setShowRejectModal(false);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to reject payment');
    } finally {
      setVerifying(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/payments/${id}/`);
      toast.success('Payment deleted');
      navigate('/erp/payments');
    } catch {
      toast.error('Failed to delete payment');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  if (!payment) return null;

  const canVerify = payment.status === 'pending' || payment.status === 'draft';
  const isVerified = payment.status === 'verified';
  const isRejected = payment.status === 'rejected';

  return (
    <div>
      <PageHeader
        title={payment.payment_id || `Payment #${payment.id}`}
        breadcrumbs={[
          { label: 'ERP', to: '/erp' },
          { label: 'Payments', to: '/erp/payments' },
          { label: payment.payment_id || `#${payment.id}` },
        ]}
        actions={
          <div className="flex items-center gap-2">
            {canVerify && (
              <>
                <button onClick={handleVerify} disabled={verifying}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-500 hover:bg-emerald-600 rounded-xl disabled:opacity-50 transition-all duration-300">
                  {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  Verify
                </button>
                <button onClick={() => setShowRejectModal(true)} disabled={verifying}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-xl disabled:opacity-50 transition-all duration-300">
                  <XCircle className="w-4 h-4" /> Reject
                </button>
              </>
            )}
            <button onClick={() => navigate(`/erp/payments/${id}/edit`)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-text-main bg-bg border border-border hover:bg-border rounded-xl transition-all duration-300">
              <Pencil className="w-4 h-4" /> Edit
            </button>
            <button onClick={() => setDeleteModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-500 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-xl transition-all duration-300">
              <Trash2 className="w-4 h-4" /> Delete
            </button>
          </div>
        }
      />

      <div className="space-y-6">
        {/* Status Banner */}
        <div className={`p-4 rounded-2xl border ${
          isVerified ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/30' :
          isRejected ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/30' :
          'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/30'
        } animate-fade-in-up`}>
          <div className="flex items-center gap-3">
            {isVerified ? <CheckCircle2 className="w-6 h-6 text-emerald-600" /> :
             isRejected ? <XCircle className="w-6 h-6 text-red-600" /> :
             <Clock className="w-6 h-6 text-amber-600" />}
            <div>
              <p className="font-semibold text-text-main">
                {isVerified ? 'Payment Verified' : isRejected ? 'Payment Rejected' : 'Pending Verification'}
              </p>
              <p className="text-sm text-text-muted">
                {isVerified ? `Verified by ${payment.verified_by_name || 'Admin'} on ${payment.verified_at ? new Date(payment.verified_at).toLocaleString() : '-'}` :
                 isRejected ? 'This payment has been rejected' :
                 'This payment is awaiting verification'}
              </p>
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Customer Info */}
          <div className="bg-surface rounded-2xl border border-border shadow-sm p-4 animate-fade-in-up">
            <div className="flex items-center gap-2 mb-3">
              <User className="w-4 h-4 text-primary" />
              <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Customer</span>
            </div>
            <p className="text-sm font-medium text-text-main">{payment.customer_name || '-'}</p>
          </div>

          {/* Booking Info */}
          <div className="bg-surface rounded-2xl border border-border shadow-sm p-4 animate-fade-in-up">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-4 h-4 text-primary" />
              <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Booking</span>
            </div>
            <p className="text-sm font-medium text-text-main">{payment.booking_id_display || '-'}</p>
          </div>

          {/* Payment Amount */}
          <div className="bg-surface rounded-2xl border border-border shadow-sm p-4 animate-fade-in-up">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="w-4 h-4 text-emerald-500" />
              <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Amount</span>
            </div>
            <p className="text-lg font-bold text-text-main">PKR {Number(payment.amount || 0).toLocaleString()}</p>
          </div>

          {/* Payment Type */}
          <div className="bg-surface rounded-2xl border border-border shadow-sm p-4 animate-fade-in-up">
            <div className="flex items-center gap-2 mb-3">
              <CreditCard className="w-4 h-4 text-primary" />
              <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Payment Type</span>
            </div>
            <p className="text-sm font-medium text-text-main">{payment.payment_type_display || 'Other'}</p>
          </div>

          {/* Method */}
          <div className="bg-surface rounded-2xl border border-border shadow-sm p-4 animate-fade-in-up">
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="w-4 h-4 text-primary" />
              <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Method</span>
            </div>
            <p className="text-sm font-medium text-text-main">{payment.payment_method_display || payment.payment_method || '-'}</p>
          </div>

          {/* Date */}
          <div className="bg-surface rounded-2xl border border-border shadow-sm p-4 animate-fade-in-up">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-primary" />
              <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Payment Date</span>
            </div>
            <p className="text-sm font-medium text-text-main">
              {payment.payment_date ? new Date(payment.payment_date).toLocaleDateString() : '-'}
            </p>
          </div>
        </div>

        {/* Detail Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Payment Details */}
          <div className="bg-surface rounded-2xl border border-border shadow-sm animate-fade-in-up">
            <div className="p-4 border-b border-border">
              <h3 className="text-sm font-semibold text-text-main font-display">Payment Information</h3>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex justify-between py-2 border-b border-border/50">
                <span className="text-sm text-text-muted">Reference Number</span>
                <span className="text-sm font-medium text-text-main">{payment.reference_number || '-'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/50">
                <span className="text-sm text-text-muted">Status</span>
                <StatusBadge status={payment.status || 'pending'} />
              </div>
              <div className="flex justify-between py-2 border-b border-border/50">
                <span className="text-sm text-text-muted">Created By</span>
                <span className="text-sm font-medium text-text-main">{payment.created_by_name || '-'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/50">
                <span className="text-sm text-text-muted">Created At</span>
                <span className="text-sm font-medium text-text-main">
                  {payment.created_at ? new Date(payment.created_at).toLocaleString() : '-'}
                </span>
              </div>
              {payment.verified_by_name && (
                <div className="flex justify-between py-2 border-b border-border/50">
                  <span className="text-sm text-text-muted">Verified By</span>
                  <span className="text-sm font-medium text-text-main">{payment.verified_by_name}</span>
                </div>
              )}
              {payment.verified_at && (
                <div className="flex justify-between py-2">
                  <span className="text-sm text-text-muted">Verified At</span>
                  <span className="text-sm font-medium text-text-main">
                    {new Date(payment.verified_at).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Cheque Details (if applicable) */}
          {payment.payment_method === 'cheque' && (
            <div className="bg-surface rounded-2xl border border-border shadow-sm animate-fade-in-up">
              <div className="p-4 border-b border-border">
                <h3 className="text-sm font-semibold text-text-main font-display">Cheque Details</h3>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex justify-between py-2 border-b border-border/50">
                  <span className="text-sm text-text-muted">Cheque Number</span>
                  <span className="text-sm font-medium text-text-main">{payment.cheque_number || '-'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border/50">
                  <span className="text-sm text-text-muted">Bank</span>
                  <span className="text-sm font-medium text-text-main">{payment.bank_name || '-'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border/50">
                  <span className="text-sm text-text-muted">Cheque Date</span>
                  <span className="text-sm font-medium text-text-main">
                    {payment.cheque_date ? new Date(payment.cheque_date).toLocaleDateString() : '-'}
                  </span>
                </div>
                {payment.bounce_reason && (
                  <div className="flex justify-between py-2 border-b border-border/50">
                    <span className="text-sm text-text-muted text-red-500">Bounce Reason</span>
                    <span className="text-sm font-medium text-red-500">{payment.bounce_reason}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notes */}
          {payment.notes && (
            <div className="bg-surface rounded-2xl border border-border shadow-sm animate-fade-in-up">
              <div className="p-4 border-b border-border">
                <h3 className="text-sm font-semibold text-text-main font-display">Notes</h3>
              </div>
              <div className="p-4">
                <p className="text-sm text-text-main whitespace-pre-wrap">{payment.notes}</p>
              </div>
            </div>
          )}

          {/* Attachments */}
          {payment.attachments && payment.attachments.length > 0 && (
            <div className="bg-surface rounded-2xl border border-border shadow-sm animate-fade-in-up">
              <div className="p-4 border-b border-border">
                <h3 className="text-sm font-semibold text-text-main font-display">Attachments</h3>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-2 gap-3">
                  {payment.attachments.map((att, i) => (
                    <div key={i} className="p-3 bg-bg rounded-xl border border-border">
                      {att.file_url ? (
                        att.file_url.match(/\.(jpg|jpeg|png|webp)/i) ? (
                          <img src={att.file_url} alt={att.filename} className="w-full h-24 object-cover rounded-lg mb-2" />
                        ) : (
                          <div className="w-full h-24 bg-primary/5 rounded-lg flex items-center justify-center mb-2">
                            <FileText className="w-8 h-8 text-primary" />
                          </div>
                        )
                      ) : null}
                      <p className="text-xs text-text-muted truncate">{att.filename}</p>
                      <p className="text-[10px] text-text-muted/60">{att.attachment_type?.replace(/_/g, ' ')}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reject Modal */}
      <ConfirmModal
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        onConfirm={handleReject}
        title="Reject Payment"
        message={
          <div>
            <p className="text-sm text-text-muted mb-3">Are you sure you want to reject this payment? Add a reason below.</p>
            <textarea
              value={rejectNotes}
              onChange={(e) => setRejectNotes(e.target.value)}
              placeholder="Reason for rejection..."
              rows={3}
              className="w-full px-4 py-3 bg-bg border border-border rounded-xl text-sm text-text-main placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
            />
          </div>
        }
        confirmText="Reject Payment"
        confirmClassName="bg-red-500 hover:bg-red-600"
      />

      {/* Delete Modal */}
      <ConfirmModal
        isOpen={deleteModal}
        onClose={() => setDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Payment"
        message={`Are you sure you want to delete payment ${payment.payment_id}? This action cannot be undone.`}
        confirmText="Delete"
      />
    </div>
  );
}
```

---
### Task 9: Frontend — Booking Detail Payment Plan Tab

**Files:**
- Modify: `frontend/src/pages/erp/BookingDetailPage.jsx`

**Interfaces:**
- Consumes: `bookingPaymentAPI.getPaymentSummary()`, `InstallmentSchedule`, `PaymentProgressBar`, `PaymentSummaryCard`
- Produces: Payment Plan tab with setup form and schedule display

- [ ] **Step 1: Rewrite BookingDetailPage.jsx with Payment Plan tab**

Add imports at top:

```jsx
import { Plus, Settings, CheckCircle, Loader2 } from 'lucide-react';
import PaymentProgressBar from '../../components/erp/PaymentProgressBar';
import PaymentSummaryCard from '../../components/erp/PaymentSummaryCard';
import InstallmentSchedule from '../../components/erp/InstallmentSchedule';
```

Update the tabs array to include 'plan':

```jsx
const tabs = [
  { id: 'plan', label: 'Payment Plan', icon: Settings },
  { id: 'installments', label: 'Installments', count: installments.length, icon: Calendar },
  { id: 'payments', label: 'Payments', count: payments.length, icon: CreditCard },
];
```

Keep the existing tab content for 'installments' and 'payments'. Add a new `activeTab === 'plan'` section. Add this right after the `activeTab === 'payments'` closing brace:

```jsx
{activeTab === 'plan' && (
  <div className="space-y-6">
    {bookingSummary?.has_installment_plan ? (
      <>
        {/* Progress */}
        <PaymentProgressBar percent={bookingSummary.progress_percent} />

        {/* Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PaymentSummaryCard
            propertyPrice={bookingSummary.property_price}
            discount={bookingSummary.discount}
            finalPrice={bookingSummary.final_price}
            downPayment={bookingSummary.down_payment}
            remainingAmount={bookingSummary.remaining_amount}
            monthlyInstallment={bookingSummary.installment_amount}
            totalPaid={bookingSummary.total_paid}
            progressPercent={bookingSummary.progress_percent}
          />

          {/* Plan Details */}
          <div className="bg-surface rounded-2xl border border-border shadow-sm p-5">
            <h3 className="text-sm font-semibold text-text-main font-display mb-4">Installment Plan</h3>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-border/50">
                <span className="text-sm text-text-muted">Duration</span>
                <span className="text-sm font-medium text-text-main">{bookingSummary.total_installments} months</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/50">
                <span className="text-sm text-text-muted">Frequency</span>
                <span className="text-sm font-medium text-text-main">{bookingSummary.installment_plan?.frequency_display || 'Monthly'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/50">
                <span className="text-sm text-text-muted">Installment Amount</span>
                <span className="text-sm font-medium text-text-main">
                  PKR {Number(bookingSummary.installment_amount).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/50">
                <span className="text-sm text-text-muted">Total Paid</span>
                <span className="text-sm font-medium text-emerald-600">PKR {Number(bookingSummary.total_paid).toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-sm text-text-muted">Outstanding</span>
                <span className="text-sm font-medium text-amber-600">PKR {Number(bookingSummary.outstanding).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Installment Schedule */}
        <div className="bg-surface rounded-2xl border border-border shadow-sm">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="text-sm font-semibold text-text-main font-display">Installment Schedule</h3>
            <button onClick={() => navigate(`/erp/payments/new?booking=${booking.id}&installment=`)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-primary to-primary-light rounded-lg hover:shadow-lg transition-all duration-300">
              <Plus className="w-3 h-3" /> Record Payment
            </button>
          </div>
          <div className="p-4">
            <InstallmentSchedule
              installments={bookingSummary.installments || []}
              onReceivePayment={(inst) => navigate(`/erp/payments/new?booking=${booking.id}&installment=${inst.id || inst.installment_number}`)}
            />
          </div>
        </div>
      </>
    ) : (
      /* No payment plan — show setup form */
      <PaymentPlanSetup bookingId={booking.id} onPlanCreated={() => { window.location.reload(); }} />
    )}
  </div>
)}
```

Add the `PaymentPlanSetup` sub-component (can be inline in the same file or at bottom). Add before `export default`:

```jsx
function PaymentPlanSetup({ bookingId, onPlanCreated }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [form, setForm] = useState({
    discount: '',
    down_payment: '',
    payment_option: 'installment',
    duration: 12,
    custom_duration: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(`/bookings/${bookingId}/payment-summary/`);
        setSummary(data);
      } catch { /* ignore */ }
    })();
  }, [bookingId]);

  const propertyPrice = summary?.property_price || 0;
  const discount = Number(form.discount) || 0;
  const finalPrice = propertyPrice - discount;
  const downPayment = Number(form.down_payment) || 0;
  const remaining = finalPrice - downPayment;
  const duration = form.payment_option === 'installment' ? (Number(form.custom_duration) || Number(form.duration)) : 0;
  const monthlyInstallment = duration > 0 ? remaining / duration : 0;

  const validate = () => {
    const errs = {};
    if (!form.down_payment || Number(form.down_payment) < 0) errs.down_payment = 'Valid down payment required';
    if (Number(form.down_payment) > finalPrice) errs.down_payment = 'Down payment cannot exceed final price';
    if (form.payment_option === 'installment' && duration < 1) errs.duration = 'Valid duration required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      setLoading(true);
      const payload = {
        booking: bookingId,
        down_payment_amount: downPayment,
        total_installments: duration,
        installment_amount: Math.round(monthlyInstallment * 100) / 100,
        start_date: new Date().toISOString().split('T')[0],
        frequency: 'monthly',
        due_day: 1,
        generate_now: true,
      };
      await api.post('/installment-plans/', payload);
      toast.success('Payment plan created');
      onPlanCreated?.();
    } catch (err) {
      toast.error('Failed to create payment plan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-surface rounded-2xl border border-border shadow-sm p-6">
        <h3 className="text-base font-semibold text-text-main font-display mb-2">Set Up Payment Plan</h3>
        <p className="text-sm text-text-muted mb-6">Configure the payment plan for this booking</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="relative">
              <input type="number" value={propertyPrice} disabled
                className="w-full px-4 pt-6 pb-2 bg-bg/50 border border-border rounded-xl text-sm text-text-main opacity-70 cursor-not-allowed" />
              <label className="absolute left-4 top-2 text-xs text-text-muted">Property Price (PKR)</label>
            </div>
            <div className="relative">
              <input type="number" name="discount" value={form.discount} onChange={(e) => setForm({...form, discount: e.target.value})} placeholder=" " min="0"
                className="peer w-full px-4 pt-6 pb-2 bg-bg border border-border rounded-xl text-sm text-text-main placeholder-transparent focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200" />
              <label className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-text-muted/70 peer-focus:top-2 peer-focus:text-xs peer-focus:text-primary peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-text-muted transition-all duration-200">
                Discount (PKR)
              </label>
            </div>
            <div className="relative">
              <input type="number" value={finalPrice} disabled
                className="w-full px-4 pt-6 pb-2 bg-primary/5 border border-primary/20 rounded-xl text-sm font-semibold text-primary" />
              <label className="absolute left-4 top-2 text-xs text-primary">Final Sale Price</label>
            </div>
            <div className="relative">
              <input type="number" name="down_payment" value={form.down_payment} onChange={(e) => setForm({...form, down_payment: e.target.value})} placeholder=" " min="0"
                className={`peer w-full px-4 pt-6 pb-2 bg-bg border rounded-xl text-sm text-text-main placeholder-transparent focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 ${errors.down_payment ? 'border-red-400' : 'border-border focus:border-primary'}`} />
              <label className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-text-muted/70 peer-focus:top-2 peer-focus:text-xs peer-focus:text-primary peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-text-muted transition-all duration-200">
                Down Payment (PKR) <span className="text-red-400">*</span>
              </label>
            </div>
            {errors.down_payment && <p className="text-xs text-red-500">{errors.down_payment}</p>}

            {/* Remaining Amount (auto-calculated) */}
            <div className="relative">
              <input type="number" value={remaining} disabled
                className="w-full px-4 pt-6 pb-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 rounded-xl text-sm font-semibold text-amber-700 dark:text-amber-300" />
              <label className="absolute left-4 top-2 text-xs text-amber-600 dark:text-amber-400">Remaining Amount</label>
            </div>
          </div>

          {/* Payment Option */}
          <div className="pt-4 border-t border-border">
            <p className="text-sm font-medium text-text-main mb-3">Payment Option</p>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="payment_option" value="one_time" checked={form.payment_option === 'one_time'}
                  onChange={() => setForm({...form, payment_option: 'one_time'})} className="text-primary focus:ring-primary" />
                <span className="text-sm text-text-main">One Time Payment</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="payment_option" value="installment" checked={form.payment_option === 'installment'}
                  onChange={() => setForm({...form, payment_option: 'installment'})} className="text-primary focus:ring-primary" />
                <span className="text-sm text-text-main">Installment Plan</span>
              </label>
            </div>
          </div>

          {/* Duration (if installment) */}
          {form.payment_option === 'installment' && (
            <div>
              <p className="text-sm font-medium text-text-main mb-3">Duration</p>
              <div className="flex items-center gap-2 flex-wrap mb-3">
                {[6, 12, 18, 24, 36, 48, 60].map((m) => (
                  <button key={m} type="button" onClick={() => setForm({...form, duration: m, custom_duration: ''})}
                    className={`px-4 py-2 rounded-xl text-xs font-medium border transition-all duration-200 ${
                      Number(form.duration) === m && !form.custom_duration
                        ? 'bg-primary text-white border-primary'
                        : 'bg-bg text-text-muted border-border hover:border-primary/30'
                    }`}
                  >
                    {m} Months
                  </button>
                ))}
              </div>
              <div className="relative max-w-xs">
                <input type="number" name="custom_duration" value={form.custom_duration} onChange={(e) => setForm({...form, custom_duration: e.target.value, duration: ''})} placeholder=" "
                  className="peer w-full px-4 pt-6 pb-2 bg-bg border border-border rounded-xl text-sm text-text-main placeholder-transparent focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200" />
                <label className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-text-muted/70 peer-focus:top-2 peer-focus:text-xs peer-focus:text-primary peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-text-muted transition-all duration-200">
                  Custom Months
                </label>
              </div>
            </div>
          )}

          {/* Live Calculation Summary */}
          {(form.payment_option === 'installment' && duration > 0 && remaining > 0) && (
            <div className="p-4 bg-primary/5 border border-primary/10 rounded-xl space-y-2">
              <p className="text-sm font-semibold text-primary">Installment Summary</p>
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Duration</span>
                <span className="font-medium text-text-main">{duration} months</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Monthly Installment</span>
                <span className="font-semibold text-text-main text-base">PKR {Math.round(monthlyInstallment).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t border-primary/10">
                <span className="text-text-muted">Total Installments Amount</span>
                <span className="font-medium text-text-main">PKR {Math.round(monthlyInstallment * duration).toLocaleString()}</span>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="submit" disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-primary to-primary-light rounded-xl hover:shadow-lg hover:shadow-primary/25 disabled:opacity-50 transition-all duration-300">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              Create Payment Plan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

Also add `bookingSummary` state and `BookingDetailPage` needs to fetch it. Add these state variables:

```jsx
const [bookingSummary, setBookingSummary] = useState(null);
```

Add a useEffect to fetch it:

```jsx
useEffect(() => {
  if (!booking || !id) return;
  (async () => {
    try {
      const { data } = await api.get(`/bookings/${id}/payment-summary/`);
      setBookingSummary(data);
    } catch { /* ignore */ }
  })();
}, [id, booking]);
```

---
### Task 10: Verify and Fix Integration Issues

**Files:**
- All modified files

- [ ] **Step 1: Verify dev server starts without errors**

```bash
cd frontend
npm run dev
```

Expected: dev server starts, no compilation errors.

- [ ] **Step 2: Verify Django backend**

```bash
python manage.py check
python manage.py migrate
```

Expected: No errors, migrations applied.

- [ ] **Step 3: Verify routing**

Navigate to `/erp/payments`, `/erp/payments/new`, `/erp/bookings/:id` — all pages render without errors.

- [ ] **Step 4: Check for any missing imports**

Verify all imported components exist in the expected paths. Pay special attention to the `PaymentDetailPage` import in `App.jsx` and the new components in `BookingDetailPage.jsx`.

---
