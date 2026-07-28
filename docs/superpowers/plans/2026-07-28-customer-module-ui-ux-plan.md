# Customer Module UI/UX Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the Customer module UI/UX with compact 2-column forms, file/image upload, a Customer Detail page, and polished input styling — while preserving all existing functionality.

**Architecture:** Add `document` and `image` FileFields to the Django Customer model. Create reusable `FileUpload` and `ImageUpload` React components. Redesign `CustomerFormPage` with a compact 2-column grid layout and fixed input styling. Add a new `CustomerDetailPage` with profile card, info grid, and document download. Update `CustomersPage` with a View button.

**Tech Stack:** Django REST Framework, React 18, React Router v6, Tailwind CSS 3, lucide-react icons, axios

## Global Constraints

- Do NOT change existing API endpoint paths (`/api/customers/`, `/api/customers/:id/`)
- Do NOT remove existing validations (CNIC format, phone format, required fields)
- Do NOT change Customer model field names (first_name, last_name, cnic, phone, etc.)
- Follow existing Tailwind CSS design system: CSS variables (`--color-primary`, `--color-bg`, etc.), `erp-card`, `erp-btn-primary` classes, `rounded-xl` border radius
- All file uploads are OPTIONAL — forms must submit successfully without them
- Use `multipart/form-data` for file uploads, regular JSON for non-file submissions
- Preserve all existing CRUD, search, and theme functionality

---

## File Map

### Backend Files
| File | Action | Purpose |
|------|--------|---------|
| `customers/models.py` | Modify | Add `document` and `image` FileFields |
| `customers/serializers.py` | Modify | Include new fields, add `document_name` computed field |
| `customers/migrations/0002_customer_document_customer_image.py` | Create | Migration for new fields |
| `samana_erp/settings.py` | Modify | Add MEDIA_URL and MEDIA_ROOT |
| `samana_erp/urls.py` | Modify | Serve media files in development |

### Frontend Files
| File | Action | Purpose |
|------|--------|---------|
| `frontend/src/App.jsx` | Modify | Add customer routes |
| `frontend/src/components/erp/Sidebar.jsx` | Modify | Update nav link to `/erp/customers` |
| `frontend/src/components/erp/FileUpload.jsx` | Create | Reusable document upload component |
| `frontend/src/components/erp/ImageUpload.jsx` | Create | Reusable image upload component |
| `frontend/src/pages/erp/CustomerFormPage.jsx` | Modify | Complete redesign |
| `frontend/src/pages/erp/CustomersPage.jsx` | Modify | Add View button |
| `frontend/src/pages/erp/CustomerDetailPage.jsx` | Create | New detail page |
| `frontend/src/services/api.js` | Modify | Update customerService for FormData |

---

## Task 1: Backend — Add File/Image Fields to Customer Model

**Files:**
- Modify: `customers/models.py:5-20`
- Create: `customers/migrations/0002_customer_document_customer_image.py`

**Interfaces:**
- Produces: `Customer.document` (FileField, nullable), `Customer.image` (ImageField, nullable)

- [ ] **Step 1: Add fields to Customer model**

Open `customers/models.py` and add the two new fields after the `notes` field (line 16) and before `is_active` (line 17):

```python
from django.db import models
from django.contrib.auth.models import User


class Customer(models.Model):
    customer_id = models.CharField(max_length=20, unique=True, editable=False)
    user = models.OneToOneField(User, on_delete=models.SET_NULL, null=True, blank=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField(unique=True, blank=True, null=True)
    phone = models.CharField(max_length=20)
    alternate_phone = models.CharField(max_length=20, blank=True)
    cnic = models.CharField(max_length=15, unique=True)
    address = models.TextField(blank=True)
    city = models.CharField(max_length=100, blank=True)
    notes = models.TextField(blank=True)
    document = models.FileField(upload_to='customers/documents/', blank=True, null=True)
    image = models.ImageField(upload_to='customers/images/', blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='customers_created')
```

- [ ] **Step 2: Generate migration**

Run: `python manage.py makemigrations customers`
Expected: Creates `customers/migrations/0002_customer_document_customer_image.py`

- [ ] **Step 3: Apply migration**

Run: `python manage.py migrate`
Expected: Migration applies successfully

- [ ] **Step 4: Verify in Django shell**

Run: `python manage.py shell -c "from customers.models import Customer; print([f.name for f in Customer._meta.get_fields()])"`
Expected: List includes `document` and `image`

- [ ] **Step 5: Commit**

```bash
git add customers/models.py customers/migrations/
git commit -m "feat: add document and image fields to Customer model"
```

---

## Task 2: Backend — Update Serializers for File Upload

**Files:**
- Modify: `customers/serializers.py:19-67`

**Interfaces:**
- Consumes: `Customer.document`, `Customer.image` (from Task 1)
- Produces: `CustomerSerializer` includes `document`, `image`, `document_name`; `CustomerCreateSerializer` includes `document`, `image`

- [ ] **Step 1: Update CustomerSerializer**

Replace the entire `customers/serializers.py` with:

```python
from rest_framework import serializers
from .models import Customer, CustomerLedgerEntry


class CustomerLedgerEntrySerializer(serializers.ModelSerializer):
    transaction_type_display = serializers.CharField(source='get_transaction_type_display', read_only=True)
    created_by_name = serializers.CharField(source='created_by.username', read_only=True, allow_null=True)
    booking_id_display = serializers.CharField(source='booking.booking_id', read_only=True, allow_null=True)
    
    class Meta:
        model = CustomerLedgerEntry
        fields = ['id', 'customer', 'booking', 'booking_id_display', 'transaction_type',
                  'transaction_type_display', 'reference_id', 'debit', 'credit',
                  'running_balance', 'description', 'entry_date', 'created_by',
                  'created_by_name', 'created_at']
        read_only_fields = ['id', 'running_balance', 'created_at', 'created_by']


class CustomerSerializer(serializers.ModelSerializer):
    full_name = serializers.ReadOnlyField()
    total_bookings = serializers.ReadOnlyField()
    total_paid = serializers.ReadOnlyField()
    current_balance = serializers.ReadOnlyField()
    document_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Customer
        fields = ['id', 'customer_id', 'first_name', 'last_name', 'full_name', 'email',
                  'phone', 'alternate_phone', 'cnic', 'address', 'city', 'notes',
                  'document', 'image', 'document_name',
                  'is_active', 'total_bookings', 'total_paid', 'current_balance',
                  'created_at', 'updated_at', 'created_by']
        read_only_fields = ['id', 'customer_id', 'created_at', 'updated_at', 'created_by']
    
    def get_document_name(self, obj):
        if obj.document:
            import os
            return os.path.basename(obj.document.name)
        return None
    
    def validate_cnic(self, value):
        import re
        pattern = r'^\d{5}-\d{7}-\d{1}$'
        if not re.match(pattern, value):
            raise serializers.ValidationError('CNIC format must be XXXXX-XXXXXXX-X')
        return value
    
    def validate_phone(self, value):
        import re
        pattern = r'^\+?[\d\-]{10,15}$'
        if not re.match(pattern, value):
            raise serializers.ValidationError('Enter a valid phone number (10-15 digits)')
        return value


class CustomerCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = ['first_name', 'last_name', 'email', 'phone', 'alternate_phone',
                  'cnic', 'address', 'city', 'notes', 'is_active',
                  'document', 'image']
    
    def validate_cnic(self, value):
        import re
        pattern = r'^\d{5}-\d{7}-\d{1}$'
        if not re.match(pattern, value):
            raise serializers.ValidationError('CNIC format must be XXXXX-XXXXXXX-X')
        return value
    
    def validate_phone(self, value):
        import re
        pattern = r'^\+?[\d\-]{10,15}$'
        if not re.match(pattern, value):
            raise serializers.ValidationError('Enter a valid phone number (10-15 digits)')
        return value


class CustomerDetailSerializer(serializers.ModelSerializer):
    """Detailed customer with ledger summary and payment info."""
    full_name = serializers.ReadOnlyField()
    total_bookings = serializers.ReadOnlyField()
    total_paid = serializers.ReadOnlyField()
    current_balance = serializers.ReadOnlyField()
    ledger_summary = serializers.SerializerMethodField()
    document_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Customer
        fields = ['id', 'customer_id', 'first_name', 'last_name', 'full_name', 'email',
                  'phone', 'alternate_phone', 'cnic', 'address', 'city', 'notes',
                  'document', 'image', 'document_name',
                  'is_active', 'total_bookings', 'total_paid', 'current_balance',
                  'ledger_summary', 'created_at', 'updated_at']
        read_only_fields = ['id', 'customer_id', 'created_at', 'updated_at']
    
    def get_document_name(self, obj):
        if obj.document:
            import os
            return os.path.basename(obj.document.name)
        return None
    
    def get_ledger_summary(self, obj):
        from django.db.models import Sum
        total_debit = obj.ledger_entries.aggregate(total=Sum('debit'))['total'] or 0
        total_credit = obj.ledger_entries.aggregate(total=Sum('credit'))['total'] or 0
        return {
            'total_debit': total_debit,
            'total_credit': total_credit,
            'balance': total_debit - total_credit,
        }
```

- [ ] **Step 2: Verify serializer fields**

Run: `python manage.py shell -c "from customers.serializers import CustomerSerializer; print(CustomerSerializer().get_fields().keys())"`
Expected: Includes `document`, `image`, `document_name`

- [ ] **Step 3: Commit**

```bash
git add customers/serializers.py
git commit -m "feat: update Customer serializers with file/image fields"
```

---

## Task 3: Backend — MEDIA Configuration

**Files:**
- Modify: `samana_erp/settings.py` (add 2 lines)
- Modify: `samana_erp/urls.py:1-5, 58` (add import + static serving)

**Interfaces:**
- Consumes: `Customer.document`, `Customer.image` file storage paths
- Produces: Media files served at `/media/` in development

- [ ] **Step 1: Add MEDIA settings**

Open `samana_erp/settings.py`. Find the line `STATIC_URL = '/static/'` (or near the end of the file where static/media settings go) and add after it:

```python
# Media files
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'
```

- [ ] **Step 2: Serve media in development**

Open `samana_erp/urls.py`. Add the import at the top:

```python
from django.conf import settings
from django.conf.urls.static import static
```

Add at the end of `urlpatterns`:

```python
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
```

- [ ] **Step 3: Verify server starts**

Run: `python manage.py runserver`
Expected: Server starts without errors

- [ ] **Step 4: Commit**

```bash
git add samana_erp/settings.py samana_erp/urls.py
git commit -m "feat: add MEDIA_URL/MEDIA_ROOT configuration for file uploads"
```

---

## Task 4: Frontend — Update Routing and Sidebar

**Files:**
- Modify: `frontend/src/App.jsx:1-44`
- Modify: `frontend/src/components/erp/Sidebar.jsx:18-26`

**Interfaces:**
- Produces: Routes `/erp/customers`, `/erp/customers/new`, `/erp/customers/:id`, `/erp/customers/:id/edit`

- [ ] **Step 1: Update App.jsx with customer routes**

Replace the entire `frontend/src/App.jsx` with:

```jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import HomePage from './pages/HomePage';
import ErpLayout from './components/erp/Layout';
import LoginPage from './pages/erp/LoginPage';
import DashboardPage from './pages/erp/DashboardPage';
import CustomersPage from './pages/erp/CustomersPage';
import CustomerFormPage from './pages/erp/CustomerFormPage';
import CustomerDetailPage from './pages/erp/CustomerDetailPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public site */}
        <Route
          path="/"
          element={
            <div className="min-h-screen bg-bg">
              <Navbar />
              <main>
                <HomePage />
              </main>
              <Footer />
            </div>
          }
        />

        {/* ERP routes */}
        <Route path="/erp" element={<ErpLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="customers" element={<CustomersPage />} />
          <Route path="customers/new" element={<CustomerFormPage />} />
          <Route path="customers/:id" element={<CustomerDetailPage />} />
          <Route path="customers/:id/edit" element={<CustomerFormPage />} />
          <Route path="projects" element={<div className="text-text-muted text-center py-20">Projects page coming soon</div>} />
          <Route path="finance" element={<div className="text-text-muted text-center py-20">Finance page coming soon</div>} />
          <Route path="inventory" element={<div className="text-text-muted text-center py-20">Inventory page coming soon</div>} />
          <Route path="reports" element={<div className="text-text-muted text-center py-20">Reports page coming soon</div>} />
          <Route path="settings" element={<div className="text-text-muted text-center py-20">Settings page coming soon</div>} />
        </Route>

        {/* Standalone login (outside layout) */}
        <Route path="/erp/login" element={<LoginPage />} />
      </Routes>
    </BrowserRouter>
  );
}
```

- [ ] **Step 2: Update Sidebar navigation**

In `frontend/src/components/erp/Sidebar.jsx`, change the `clients` navItem (line 21) from:

```jsx
{ to: '/erp/clients', label: 'Clients', icon: Users },
```

To:

```jsx
{ to: '/erp/customers', label: 'Customers', icon: Users },
```

- [ ] **Step 3: Verify build**

Run: `cd frontend && npm run build`
Expected: Build succeeds with no errors

- [ ] **Step 4: Commit**

```bash
git add frontend/src/App.jsx frontend/src/components/erp/Sidebar.jsx
git commit -m "feat: add customer routes and update sidebar navigation"
```

---

## Task 5: Frontend — Create FileUpload Component

**Files:**
- Create: `frontend/src/components/erp/FileUpload.jsx`

**Interfaces:**
- Produces: `<FileUpload file={File|null} onChange={(File|null) => void} accept={string} label={string} />`

- [ ] **Step 1: Create FileUpload component**

Create `frontend/src/components/erp/FileUpload.jsx`:

```jsx
import React, { useRef, useState } from 'react';
import { Upload, FileText, X } from 'lucide-react';

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default function FileUpload({
  file,
  onChange,
  accept = '.pdf,.doc,.docx,.txt,.rtf,.csv,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.7z',
  label = 'Upload Document',
  helperText = 'PDF, DOC, DOCX, XLS, XLSX, PPT, TXT, ZIP and more',
}) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = (f) => {
    if (f && f.size > 50 * 1024 * 1024) {
      alert('File size must be less than 50MB');
      return;
    }
    onChange(f);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    handleFile(f);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  if (file) {
    return (
      <div className="flex items-center gap-3 p-3 bg-primary/5 border border-border rounded-xl">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <FileText className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-text-main truncate">{file.name}</p>
          <p className="text-xs text-text-muted">{formatFileSize(file.size)}</p>
        </div>
        <button
          type="button"
          onClick={() => onChange(null)}
          className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-text-muted hover:text-red-500 transition-colors shrink-0"
          title="Remove file"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={() => inputRef.current?.click()}
      className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 ${
        dragOver
          ? 'border-primary bg-primary/5'
          : 'border-border hover:border-primary/50 hover:bg-primary/5'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={(e) => handleFile(e.target.files[0])}
        className="hidden"
      />
      <Upload className={`w-8 h-8 mb-2 ${dragOver ? 'text-primary' : 'text-text-muted/50'}`} />
      <p className="text-sm font-medium text-text-main">{label}</p>
      <p className="text-xs text-text-muted mt-1">{helperText}</p>
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `cd frontend && npm run build`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/erp/FileUpload.jsx
git commit -m "feat: create reusable FileUpload component"
```

---

## Task 6: Frontend — Create ImageUpload Component

**Files:**
- Create: `frontend/src/components/erp/ImageUpload.jsx`

**Interfaces:**
- Produces: `<ImageUpload file={File|null} preview={string|null} onChange={(File|null) => void} />`

- [ ] **Step 1: Create ImageUpload component**

Create `frontend/src/components/erp/ImageUpload.jsx`:

```jsx
import React, { useRef, useState } from 'react';
import { Image, X, Replace } from 'lucide-react';

const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/bmp', 'image/svg+xml', 'image/x-icon'];

export default function ImageUpload({
  file,
  preview,
  onChange,
  label = 'Customer Image',
  helperText = 'JPG, PNG, WEBP, GIF, SVG',
}) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = (f) => {
    if (!f) return;
    if (!ACCEPTED_TYPES.includes(f.type) && !f.name.match(/\.(heic|HEIC)$/i)) {
      alert('Please select a valid image file');
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      alert('Image size must be less than 10MB');
      return;
    }
    onChange(f);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    handleFile(f);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const displayPreview = file ? URL.createObjectURL(file) : preview;

  if (displayPreview) {
    return (
      <div className="relative group">
        <img
          src={displayPreview}
          alt="Customer preview"
          className="w-full h-48 object-cover rounded-xl border border-border"
        />
        <div className="absolute inset-0 bg-black/40 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
            className="px-3 py-2 text-xs font-medium text-white bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition-colors"
          >
            Replace
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onChange(null); }}
            className="px-3 py-2 text-xs font-medium text-white bg-red-500/80 backdrop-blur-sm rounded-lg hover:bg-red-500 transition-colors"
          >
            Remove
          </button>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={(e) => handleFile(e.target.files[0])}
          className="hidden"
        />
      </div>
    );
  }

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={() => inputRef.current?.click()}
      className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 ${
        dragOver
          ? 'border-primary bg-primary/5'
          : 'border-border hover:border-primary/50 hover:bg-primary/5'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={(e) => handleFile(e.target.files[0])}
        className="hidden"
      />
      <Image className={`w-8 h-8 mb-2 ${dragOver ? 'text-primary' : 'text-text-muted/50'}`} />
      <p className="text-sm font-medium text-text-main">{label}</p>
      <p className="text-xs text-text-muted mt-1">{helperText}</p>
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `cd frontend && npm run build`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/erp/ImageUpload.jsx
git commit -m "feat: create reusable ImageUpload component"
```

---

## Task 7: Frontend — Update API Service for File Uploads

**Files:**
- Modify: `frontend/src/services/api.js:22-24`

**Interfaces:**
- Consumes: `File` objects from FileUpload/ImageUpload components
- Produces: `customerService.create(formData)`, `customerService.update(id, formData)`

- [ ] **Step 1: Update customerService**

Replace the `customerService` in `frontend/src/services/api.js`:

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: '/api/',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const projectService = {
  getAll: () => api.get('/projects/'),
  getById: (id) => api.get(`/projects/${id}/`),
};

export const customerService = {
  create: (data) => {
    if (data instanceof FormData) {
      return api.post('/customers/', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    }
    return api.post('/customers/', data);
  },
  update: (id, data) => {
    if (data instanceof FormData) {
      return api.put(`/customers/${id}/`, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    }
    return api.put(`/customers/${id}/`, data);
  },
};

export const plotService = {
  getAll: () => api.get('/plots/'),
};

export default api;
```

- [ ] **Step 2: Verify build**

Run: `cd frontend && npm run build`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add frontend/src/services/api.js
git commit -m "feat: update customerService to support FormData file uploads"
```

---

## Task 8: Frontend — Redesign CustomerFormPage

**Files:**
- Modify: `frontend/src/pages/erp/CustomerFormPage.jsx` (full rewrite)

**Interfaces:**
- Consumes: `FileUpload` component, `ImageUpload` component, `api.get/post/put`, `customerService.create/update`
- Produces: Navigates to `/erp/customers` on success

- [ ] **Step 1: Rewrite CustomerFormPage**

Replace the entire `frontend/src/pages/erp/CustomerFormPage.jsx` with:

```jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, User, Phone, Mail, MapPin, Building, FileText } from 'lucide-react';
import api from '../../services/api';
import { customerService } from '../../services/api';
import PageHeader from '../../components/erp/PageHeader';
import FileUpload from '../../components/erp/FileUpload';
import ImageUpload from '../../components/erp/ImageUpload';
import { toast } from '../../utils/toast';

const emptyForm = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  alternate_phone: '',
  cnic: '',
  address: '',
  city: '',
  notes: '',
  is_active: true,
};

export default function CustomerFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [documentFile, setDocumentFile] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [existingDocument, setExistingDocument] = useState(null);
  const [existingImage, setExistingImage] = useState(null);

  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      try {
        setFetching(true);
        const { data } = await api.get(`/customers/${id}/`);
        setForm({
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          email: data.email || '',
          phone: data.phone || '',
          alternate_phone: data.alternate_phone || '',
          cnic: data.cnic || '',
          address: data.address || '',
          city: data.city || '',
          notes: data.notes || '',
          is_active: data.is_active !== false,
        });
        if (data.document) setExistingDocument(data.document);
        if (data.image) setExistingImage(data.image);
      } catch (err) {
        toast.error('Failed to load customer');
        navigate('/erp/customers');
      } finally {
        setFetching(false);
      }
    })();
  }, [id, isEdit, navigate]);

  const validate = () => {
    const errs = {};
    if (!form.first_name.trim()) errs.first_name = 'First name is required';
    if (!form.last_name.trim()) errs.last_name = 'Last name is required';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Invalid email';
    if (!form.phone.trim()) errs.phone = 'Phone is required';
    if (form.cnic && !/^\d{5}-\d{7}-\d{1}$/.test(form.cnic)) errs.cnic = 'CNIC format: XXXXX-XXXXXXX-X';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      setLoading(true);

      const hasFiles = documentFile || imageFile || 
        (isEdit && (documentFile !== null || imageFile !== null));
      
      if (hasFiles || documentFile || imageFile) {
        const formData = new FormData();
        Object.entries(form).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
            formData.append(key, value);
          }
        });
        if (documentFile) formData.append('document', documentFile);
        if (imageFile) formData.append('image', imageFile);

        if (isEdit) {
          await customerService.update(id, formData);
          toast.success('Customer updated');
        } else {
          await customerService.create(formData);
          toast.success('Customer created');
        }
      } else {
        if (isEdit) {
          await api.put(`/customers/${id}/`, form);
          toast.success('Customer updated');
        } else {
          await api.post('/customers/', form);
          toast.success('Customer created');
        }
      }
      navigate('/erp/customers');
    } catch (err) {
      const detail = err.response?.data;
      if (typeof detail === 'object' && detail !== null) {
        const fieldErrors = {};
        Object.entries(detail).forEach(([key, msgs]) => {
          fieldErrors[key] = Array.isArray(msgs) ? msgs.join(', ') : msgs;
        });
        setErrors(fieldErrors);
      }
      toast.error(err.response?.data?.detail || `Failed to ${isEdit ? 'update' : 'create'} customer`);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  const inputClass = (name) =>
    `w-full h-11 px-4 bg-bg border rounded-xl text-sm text-text-main placeholder:text-text-muted/50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 ${
      errors[name]
        ? 'border-red-400 focus:ring-red-100 focus:border-red-400'
        : 'border-border focus:border-primary'
    }`;

  return (
    <div>
      <PageHeader
        title={isEdit ? 'Edit Customer' : 'New Customer'}
        breadcrumbs={[
          { label: 'ERP', to: '/erp' },
          { label: 'Customers', to: '/erp/customers' },
          { label: isEdit ? 'Edit' : 'New' },
        ]}
      />

      <div className="max-w-4xl mx-auto animate-fade-in-up">
        <div className="bg-surface rounded-2xl border border-border shadow-sm">
          <div className="p-6 border-b border-border flex items-center gap-3">
            <button
              onClick={() => navigate('/erp/customers')}
              className="p-2 rounded-lg hover:bg-border transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-text-muted" />
            </button>
            <div>
              <h2 className="text-lg font-semibold text-text-main font-display">
                {isEdit ? 'Edit Customer' : 'Create Customer'}
              </h2>
              <p className="text-sm text-text-muted">Fill in the details below</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Row 1: First Name + Last Name */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-main mb-1.5">
                  First Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="first_name"
                  value={form.first_name}
                  onChange={handleChange}
                  placeholder="Enter first name"
                  className={inputClass('first_name')}
                />
                {errors.first_name && <p className="text-xs text-red-500 mt-1">{errors.first_name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-text-main mb-1.5">
                  Last Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="last_name"
                  value={form.last_name}
                  onChange={handleChange}
                  placeholder="Enter last name"
                  className={inputClass('last_name')}
                />
                {errors.last_name && <p className="text-xs text-red-500 mt-1">{errors.last_name}</p>}
              </div>
            </div>

            {/* Row 2: Email + Phone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-main mb-1.5">Email</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Enter email address"
                  className={inputClass('email')}
                />
                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-text-main mb-1.5">
                  Phone <span className="text-red-400">*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="Enter phone number"
                  className={inputClass('phone')}
                />
                {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
              </div>
            </div>

            {/* Row 3: Alternate Phone + CNIC */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-main mb-1.5">Alternate Phone</label>
                <input
                  type="tel"
                  name="alternate_phone"
                  value={form.alternate_phone}
                  onChange={handleChange}
                  placeholder="Enter alternate phone"
                  className={inputClass('alternate_phone')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-main mb-1.5">CNIC</label>
                <input
                  type="text"
                  name="cnic"
                  value={form.cnic}
                  onChange={handleChange}
                  placeholder="XXXXX-XXXXXXX-X"
                  className={inputClass('cnic')}
                />
                {errors.cnic && <p className="text-xs text-red-500 mt-1">{errors.cnic}</p>}
              </div>
            </div>

            {/* Row 4: Address (full width) */}
            <div>
              <label className="block text-sm font-medium text-text-main mb-1.5">Address</label>
              <input
                type="text"
                name="address"
                value={form.address}
                onChange={handleChange}
                placeholder="Enter full address"
                className={inputClass('address')}
              />
            </div>

            {/* Row 5: City + Notes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-main mb-1.5">City</label>
                <input
                  type="text"
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  placeholder="Enter city"
                  className={inputClass('city')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-main mb-1.5">Notes</label>
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  placeholder="Additional notes..."
                  rows={3}
                  className={`${inputClass('notes')} resize-none py-2.5`}
                />
              </div>
            </div>

            {/* Row 6: Document Upload + Image Upload */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-main mb-1.5">Document</label>
                <FileUpload
                  file={documentFile}
                  onChange={setDocumentFile}
                />
                {isEdit && existingDocument && !documentFile && (
                  <p className="text-xs text-text-muted mt-2 flex items-center gap-1">
                    <FileText className="w-3 h-3" /> Current: {existingDocument.split('/').pop()}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-text-main mb-1.5">Customer Image</label>
                <ImageUpload
                  file={imageFile}
                  preview={existingImage}
                  onChange={setImageFile}
                />
              </div>
            </div>

            {/* Row 7: Is Active + Buttons */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2 border-t border-border">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={form.is_active}
                  onChange={handleChange}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20"
                />
                <span className="text-sm font-medium text-text-main">Active Customer</span>
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => navigate('/erp/customers')}
                  className="px-5 py-2.5 text-sm font-medium text-text-main bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-primary to-primary-light rounded-xl hover:shadow-lg hover:shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {isEdit ? 'Update Customer' : 'Create Customer'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `cd frontend && npm run build`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/erp/CustomerFormPage.jsx
git commit -m "feat: redesign CustomerFormPage with 2-col layout, file uploads, fixed inputs"
```

---

## Task 9: Frontend — Update CustomersPage with View Button

**Files:**
- Modify: `frontend/src/pages/erp/CustomersPage.jsx:1-157`

**Interfaces:**
- Consumes: `DataTable` component, `StatusBadge` component
- Produces: View/Edit/Delete action buttons in table

- [ ] **Step 1: Rewrite CustomersPage**

Replace the entire `frontend/src/pages/erp/CustomersPage.jsx` with:

```jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Pencil, Trash2, Eye, Users, Phone, Mail, MapPin } from 'lucide-react';
import api from '../../services/api';
import DataTable from '../../components/erp/DataTable';
import PageHeader from '../../components/erp/PageHeader';
import ConfirmModal from '../../components/erp/ConfirmModal';
import StatusBadge from '../../components/erp/StatusBadge';
import { toast } from '../../utils/toast';

export default function CustomersPage() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/customers/');
      setCustomers(Array.isArray(data) ? data : data.results ?? []);
    } catch (err) {
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await api.delete(`/customers/${deleteTarget.id}/`);
      toast.success('Customer deleted');
      setDeleteTarget(null);
      fetch();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to delete customer');
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    {
      header: 'Name',
      accessor: 'full_name',
      cell: (row) => (
        <div className="flex items-center gap-3">
          {row.image ? (
            <img
              src={row.image}
              alt={row.full_name || row.name}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary-light flex items-center justify-center text-white text-xs font-bold">
              {(row.full_name || row.name || '?')[0]}
            </div>
          )}
          <div>
            <p className="font-medium text-text-main">{row.full_name || row.name}</p>
            <p className="text-xs text-text-muted flex items-center gap-1 mt-0.5">
              <Mail className="w-3 h-3" /> {row.email}
            </p>
          </div>
        </div>
      ),
    },
    {
      header: 'Phone',
      accessor: 'phone',
      cell: (row) => (
        <span className="text-text-muted text-sm flex items-center gap-1.5">
          <Phone className="w-3.5 h-3.5" /> {row.phone || '-'}
        </span>
      ),
    },
    {
      header: 'City',
      accessor: 'city',
      cell: (row) => (
        <span className="text-text-muted text-sm flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5" /> {row.city || '-'}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      cell: (row) => <StatusBadge status={row.is_active ? 'active' : 'inactive'} />,
    },
    {
      header: 'Created',
      accessor: 'created_at',
      cell: (row) => (
        <span className="text-text-muted text-sm">{row.created_at ? new Date(row.created_at).toLocaleDateString() : '-'}</span>
      ),
    },
    {
      header: '',
      accessor: 'actions',
      sortable: false,
      cell: (row) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => navigate(`/erp/customers/${row.id}`)}
            className="p-2 rounded-lg hover:bg-primary/10 text-text-muted hover:text-primary transition-colors"
            title="View"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigate(`/erp/customers/${row.id}/edit`)}
            className="p-2 rounded-lg hover:bg-primary/10 text-text-muted hover:text-primary transition-colors"
            title="Edit"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDeleteTarget(row)}
            className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-text-muted hover:text-red-500 transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Customers"
        subtitle="Manage your customer database"
        breadcrumbs={[{ label: 'ERP' }, { label: 'Customers' }]}
        actions={
          <button
            onClick={() => navigate('/erp/customers/new')}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary to-primary-light text-white text-sm font-medium rounded-xl hover:shadow-lg hover:shadow-primary/25 transition-all duration-300"
          >
            <Plus className="w-4 h-4" /> Add Customer
          </button>
        }
      />

      <DataTable
        columns={columns}
        data={customers}
        loading={loading}
        searchable
        searchPlaceholder="Search customers..."
        emptyMessage="No customers found"
        emptyIcon={Users}
      />

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Customer"
        message={`Are you sure you want to delete ${deleteTarget?.full_name || deleteTarget?.name}? This action cannot be undone.`}
        isLoading={deleting}
      />
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `cd frontend && npm run build`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/erp/CustomersPage.jsx
git commit -m "feat: add View button to CustomersPage and update status display"
```

---

## Task 10: Frontend — Create CustomerDetailPage

**Files:**
- Create: `frontend/src/pages/erp/CustomerDetailPage.jsx`

**Interfaces:**
- Consumes: `api.get('/customers/:id/')`, `StatusBadge`, `PageHeader`
- Produces: Full customer detail view with profile card, info grid, documents

- [ ] **Step 1: Create CustomerDetailPage**

Create `frontend/src/pages/erp/CustomerDetailPage.jsx`:

```jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Pencil, FileText, Download, User, Phone, Mail, MapPin, Building, Calendar, Loader2, X } from 'lucide-react';
import api from '../../services/api';
import PageHeader from '../../components/erp/PageHeader';
import StatusBadge from '../../components/erp/StatusBadge';
import { toast } from '../../utils/toast';

export default function CustomerDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/customers/${id}/`);
        setCustomer(data);
      } catch {
        toast.error('Failed to load customer');
        navigate('/erp/customers');
      } finally {
        setLoading(false);
      }
    })();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  if (!customer) return null;

  const InfoField = ({ label, value }) => (
    <div>
      <p className="text-xs font-medium text-text-muted uppercase tracking-wider mb-1">{label}</p>
      <p className="text-sm text-text-main">{value || '-'}</p>
    </div>
  );

  return (
    <div>
      <PageHeader
        title={customer.full_name || `${customer.first_name} ${customer.last_name}`}
        breadcrumbs={[
          { label: 'ERP', to: '/erp' },
          { label: 'Customers', to: '/erp/customers' },
          { label: customer.customer_id },
        ]}
        actions={
          <button
            onClick={() => navigate(`/erp/customers/${customer.id}/edit`)}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-primary to-primary-light rounded-xl hover:shadow-lg hover:shadow-primary/25 transition-all duration-300"
          >
            <Pencil className="w-4 h-4" /> Edit
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Profile Card */}
        <div className="bg-surface rounded-2xl border border-border shadow-sm p-6 animate-fade-in-up">
          <div className="flex flex-col items-center text-center">
            {customer.image ? (
              <img
                src={customer.image}
                alt={customer.full_name}
                className="w-28 h-28 rounded-2xl object-cover border-4 border-primary/10 cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setLightboxOpen(true)}
              />
            ) : (
              <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-primary to-primary-light flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                {(customer.first_name || '?')[0]}
              </div>
            )}
            <h2 className="mt-4 text-xl font-bold text-text-main font-display">
              {customer.full_name}
            </h2>
            <p className="text-sm text-text-muted font-mono">{customer.customer_id}</p>
            <div className="mt-2">
              <StatusBadge status={customer.is_active ? 'active' : 'inactive'} />
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-border grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-lg font-bold text-text-main">{customer.total_bookings || 0}</p>
              <p className="text-xs text-text-muted">Bookings</p>
            </div>
            <div>
              <p className="text-lg font-bold text-text-main">
                {customer.total_paid ? `PKR ${(customer.total_paid / 1000).toFixed(0)}K` : 'PKR 0'}
              </p>
              <p className="text-xs text-text-muted">Paid</p>
            </div>
            <div>
              <p className="text-lg font-bold text-text-main">
                {customer.current_balance ? `PKR ${(customer.current_balance / 1000).toFixed(0)}K` : 'PKR 0'}
              </p>
              <p className="text-xs text-text-muted">Balance</p>
            </div>
          </div>
        </div>

        {/* Information Card */}
        <div className="lg:col-span-2 bg-surface rounded-2xl border border-border shadow-sm animate-fade-in-up">
          <div className="p-5 border-b border-border">
            <h3 className="text-sm font-semibold text-text-main font-display uppercase tracking-wider">Customer Information</h3>
          </div>
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
            <InfoField label="First Name" value={customer.first_name} />
            <InfoField label="Last Name" value={customer.last_name} />
            <InfoField label="Email" value={customer.email} />
            <InfoField label="Phone" value={customer.phone} />
            <InfoField label="Alternate Phone" value={customer.alternate_phone} />
            <InfoField label="CNIC" value={customer.cnic} />
            <div className="md:col-span-2">
              <InfoField label="Address" value={customer.address} />
            </div>
            <InfoField label="City" value={customer.city} />
            {customer.notes && (
              <div className="md:col-span-2">
                <InfoField label="Notes" value={customer.notes} />
              </div>
            )}
            <InfoField
              label="Created"
              value={customer.created_at ? new Date(customer.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '-'}
            />
            <InfoField
              label="Updated"
              value={customer.updated_at ? new Date(customer.updated_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '-'}
            />
          </div>
        </div>
      </div>

      {/* Documents Card */}
      <div className="bg-surface rounded-2xl border border-border shadow-sm animate-fade-in-up">
        <div className="p-5 border-b border-border">
          <h3 className="text-sm font-semibold text-text-main font-display uppercase tracking-wider">Uploaded Documents</h3>
        </div>
        <div className="p-5">
          {customer.document ? (
            <div className="flex items-center gap-4 p-4 bg-primary/5 border border-border rounded-xl">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-main truncate">
                  {customer.document_name || customer.document.split('/').pop()}
                </p>
                <p className="text-xs text-text-muted">Document</p>
              </div>
              <a
                href={customer.document}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary bg-primary/10 rounded-xl hover:bg-primary/20 transition-colors shrink-0"
              >
                <Download className="w-4 h-4" /> Download
              </a>
            </div>
          ) : (
            <p className="text-center text-text-muted py-8">No documents uploaded</p>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxOpen && customer.image && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
          onClick={() => setLightboxOpen(false)}
        >
          <div className="relative max-w-2xl max-h-[90vh]">
            <img
              src={customer.image}
              alt={customer.full_name}
              className="max-w-full max-h-[85vh] rounded-2xl object-contain"
            />
            <button
              onClick={() => setLightboxOpen(false)}
              className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `cd frontend && npm run build`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/erp/CustomerDetailPage.jsx
git commit -m "feat: create CustomerDetailPage with profile card, info grid, and document download"
```

---

## Task 11: Final Verification

**Files:** None (verification only)

- [ ] **Step 1: Verify all backend migrations**

Run: `python manage.py showmigrations customers`
Expected: All migrations checked, including the new one

- [ ] **Step 2: Verify frontend build**

Run: `cd frontend && npm run build`
Expected: Build succeeds with no errors

- [ ] **Step 3: Start dev servers and manual test**

Run backend: `python manage.py runserver`
Run frontend: `cd frontend && npm run dev`

Manual verification checklist:
1. Navigate to `/erp/customers` — list loads with View/Edit/Delete buttons
2. Click "Add Customer" — form opens with 2-column layout
3. Fill in first name, last name, phone, CNIC — submit works
4. Upload a document — shows filename and size
5. Upload an image — shows preview
6. Click View on a customer — detail page loads with profile card
7. Click image on detail page — lightbox opens
8. Download document on detail page — file opens
9. Edit customer — form pre-fills with existing data
10. Toggle theme — all new components respect theme colors
11. Test on mobile viewport — single column layout

- [ ] **Step 4: Final commit (if any fixes needed)**

```bash
git add -A
git commit -m "fix: final adjustments to customer module UI/UX"
```
