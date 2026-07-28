# Customer Module UI/UX Redesign — Design Spec

**Date:** 2026-07-28  
**Status:** Draft  
**Module:** Customer Management (ERP React Frontend + Django Backend)

---

## 1. Overview

Redesign the Customer module UI/UX in the ERP React frontend to be modern, compact, and polished — similar to Odoo/Zoho/HubSpot CRM quality. Add optional file/image upload support, a Customer Detail page, and improve the overall form layout, input styling, and responsiveness.

**Constraints:**
- Do NOT break existing business logic, validations, or API contracts
- Only add new fields (file/image) that are optional
- Follow existing Tailwind CSS design system (theme CSS variables, erp-card, erp-btn-primary classes)
- All existing CRUD, search, and theme support must continue working

---

## 2. Backend Changes (Minimal)

### 2.1 Customer Model — Add File/Image Fields

Add two optional fields to `Customer` model in `customers/models.py`:

```python
document = models.FileField(upload_to='customers/documents/', blank=True, null=True)
image = models.ImageField(upload_to='customers/images/', blank=True, null=True)
```

- `document`: Accepts any common document (PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, RTF, CSV, ZIP, RAR, 7Z)
- `image`: Accepts image formats (JPG, JPEG, PNG, WEBP, GIF, BMP, SVG, ICO, HEIC)
- Both fields are optional (blank=True, null=True)
- Storage via Django's default `MEDIA_ROOT` / `MEDIA_URL`

### 2.2 Settings — MEDIA Configuration

Add to `samana_erp/settings.py`:
```python
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'
```

Add to `samana_erp/urls.py`:
```python
from django.conf import settings
from django.conf.urls.static import static
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
```

### 2.3 Serializers — Include New Fields

Update `CustomerSerializer` and `CustomerCreateSerializer` to include `document` and `image` in `fields`. Use `multipart/form-data` for create/update when files are present.

The `CustomerSerializer` will return:
- `document` (URL string or null)
- `image` (URL string or null)
- `document_name` (filename extracted from path, or null)

### 2.4 Migration

Single migration adding the two new fields. No existing data affected.

---

## 3. Frontend Routing

### 3.1 App.jsx — Add Customer Routes

Add inside the `<Route path="/erp" element={<ErpLayout />}>` block:

```jsx
<Route path="customers" element={<CustomersPage />} />
<Route path="customers/new" element={<CustomerFormPage />} />
<Route path="customers/:id" element={<CustomerDetailPage />} />
Route path="customers/:id/edit" element={<CustomerFormPage />} />
```

### 3.2 Sidebar — Update Route

Change the `clients` navItem to point to `/erp/customers` with the label "Customers".

---

## 4. Add/Edit Customer Form Redesign

### 4.1 Layout — Compact Two-Column Grid

Replace the current single-column stacking with a compact 2-column grid layout.

**Row layout:**

| Row | Column 1 | Column 2 |
|-----|----------|----------|
| 1 | First Name* | Last Name* |
| 2 | Email | Phone* |
| 3 | Alternate Phone | CNIC* |
| 4 | Address (span 2 cols) | — |
| 5 | City | Notes |
| 6 | Document Upload | Image Upload |
| 7 | Is Active checkbox | Cancel + Create buttons |

**Key changes:**
- Remove `full_name` field — use separate `first_name` and `last_name` (matches backend model)
- Remove `state` and `zip_code` fields from the form (they exist in the form but not in the `CustomerCreateSerializer` fields, so they were never sent)
- Add `is_active` checkbox (was missing from the form)
- Container: `max-w-4xl` instead of `max-w-2xl` to use more width
- Grid: `grid-cols-1 md:grid-cols-2 gap-4`
- Address field spans both columns

### 4.2 Input Styling — Fix Placeholders

Replace the current floating-label approach with a cleaner pattern:
- Use a visible `<label>` above each input (not floating)
- Inputs use consistent height: `h-11` (44px)
- Placeholder text is properly centered with `py-2.5 px-4`
- No more `peer`/`placeholder-shown` CSS hacks that cause overlap
- Consistent border radius: `rounded-xl`
- Focus ring: `focus:ring-2 focus:ring-primary/20 focus:border-primary`
- Error state: `border-red-400 focus:ring-red-100`

### 4.3 Notes Field

- Use a `<textarea>` with `rows={3}`
- Full width (spans both columns)
- Same height/padding consistency as other inputs

### 4.4 Buttons Row

- Left side: `Is Active` checkbox with label
- Right side: `Cancel` (secondary style) + `Create Customer` / `Update Customer` (primary gradient)
- Use existing `erp-btn-primary` and `erp-btn-secondary` CSS classes

---

## 5. File Upload Component

### 5.1 Document Upload

A new reusable `FileUpload` component:

**Visual:**
- Dashed border drop zone: `border-2 border-dashed border-border rounded-xl`
- Hover state: `hover:border-primary/50 hover:bg-primary/5`
- Icon: `Upload` from lucide-react
- Text: "Click to upload or drag and drop"
- Subtext: lists accepted formats

**Behavior:**
- Click opens native file input
- Drag & drop supported via `onDragOver`/`onDrop` handlers
- Accepted formats: `.pdf,.doc,.docx,.txt,.rtf,.csv,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.7z`

**After selection:**
- Show file icon, filename, file size (formatted: KB/MB)
- Remove button (X icon)

**State:** Stored as `File` object in component state, sent as `FormData` on submit.

### 5.2 Image Upload

A new reusable `ImageUpload` component:

**Visual:**
- Similar dashed border drop zone
- Icon: `Image` from lucide-react
- Text: "Click to upload or drag and drop"
- Subtext: "JPG, PNG, WEBP, GIF, SVG"

**After selection:**
- Show image preview (rounded, max-h-48)
- Replace and Remove buttons overlaid on preview

**Behavior:**
- Client-side validation: check file type before adding
- Max preview size: constrained to fit form column

---

## 6. Customer List Page Updates

### 6.1 Add View Button

In the actions column, add a `View` button before Edit and Delete:

```
[View] [Edit] [Delete]
```

- View button: `Eye` icon from lucide-react
- Style: same as Edit button (`p-2 rounded-lg hover:bg-primary/10 text-text-muted hover:text-primary transition-colors`)
- On click: navigate to `/erp/customers/${row.id}`
- Remove the `onRowClick` handler from DataTable (since we now have an explicit View button)

### 6.2 Column Updates

- Name column: Show customer avatar (image if uploaded, otherwise initial letter)
- Keep existing Phone, City, Status, Created columns
- Update the name cell to use `first_name + last_name` or `full_name` from API

---

## 7. Customer Detail Page (New)

### 7.1 Route

`/erp/customers/:id` — renders `CustomerDetailPage.jsx`

### 7.2 Page Layout

Three sections in a stacked layout:

**Section 1: Profile Card (top)**

A large card with:
- Customer image (if uploaded) — large circular preview, ~120x120px
- If no image: gradient avatar with initials (same pattern as list, but larger)
- Customer name (bold, text-xl)
- Customer ID (text-sm, text-muted)
- Status badge (using existing StatusBadge component)
- Quick stats row: Total Bookings | Total Paid | Current Balance

**Section 2: Information Card**

Two-column grid of customer fields:

| Label | Value |
|-------|-------|
| First Name | ... |
| Last Name | ... |
| Email | ... |
| Phone | ... |
| Alternate Phone | ... |
| CNIC | ... |
| Address | ... |
| City | ... |
| Notes | ... (full width) |
| Created | formatted date |
| Updated | formatted date |

Each field displayed as label (small, muted) above value (regular, text-main).

**Section 3: Documents Card**

- If document uploaded: show file icon, filename, download button
- Download link opens the file URL in a new tab
- If no document: "No documents uploaded" placeholder

### 7.3 Image Lightbox

- Click on customer image opens a modal with full-size preview
- Modal has close button and backdrop click to close
- Use existing ConfirmModal pattern as reference

### 7.4 Actions

- `Edit` button in PageHeader (navigate to `/erp/customers/:id/edit`)
- `Back` button (navigate to `/erp/customers`)

### 7.5 Data Fetching

- Use `api.get('/customers/${id}/')` which returns `CustomerDetailSerializer` data
- This includes `full_name`, `total_bookings`, `total_paid`, `current_balance`, `ledger_summary`

---

## 8. Responsive Design

### 8.1 Desktop (>= 1024px)
- Form: 2-column grid
- Detail page: Full width with 2-column info grid

### 8.2 Tablet (768px - 1023px)
- Form: 2-column grid (slightly tighter spacing)
- Detail page: 2-column info grid

### 8.3 Mobile (< 768px)
- Form: Single column
- Detail page: Single column
- Buttons stack vertically
- Upload areas full width

---

## 9. Files to Create/Modify

### New Files
1. `frontend/src/pages/erp/CustomerDetailPage.jsx` — New detail page
2. `frontend/src/components/erp/FileUpload.jsx` — Document upload component
3. `frontend/src/components/erp/ImageUpload.jsx` — Image upload component

### Modified Files
1. `frontend/src/App.jsx` — Add customer routes
2. `frontend/src/components/erp/Sidebar.jsx` — Update route to `/erp/customers`
3. `frontend/src/pages/erp/CustomersPage.jsx` — Add View button, update columns
4. `frontend/src/pages/erp/CustomerFormPage.jsx` — Complete redesign (2-col layout, separate first/last name, file uploads, fixed inputs)
5. `frontend/src/services/api.js` — Update customerService for FormData uploads
6. `customers/models.py` — Add document/image fields
7. `customers/serializers.py` — Include new fields, handle file uploads
8. `customers/migrations/` — New migration for file fields
9. `samana_erp/settings.py` — MEDIA_URL/MEDIA_ROOT
10. `samana_erp/urls.py` — Serve media files in dev

---

## 10. What We're NOT Changing

- Backend Customer model field names (first_name, last_name, cnic, phone, etc.)
- API endpoint paths (`/api/customers/`, `/api/customers/:id/`)
- Validation rules (CNIC format, phone format, required fields)
- Customer creation logic (auto-generated customer_id, audit logging)
- Search/filter functionality
- Theme system (CSS variables, ThemeContext)
- Other ERP modules (bookings, payments, properties)
- DataTable, PageHeader, StatusBadge, ConfirmModal components (only adding to them)

---

## 11. Component Architecture

```
CustomerFormPage
├── PageHeader
├── First Name / Last Name (grid row)
├── Email / Phone (grid row)
├── Alt Phone / CNIC (grid row)
├── Address (full width)
├── City / Notes (grid row)
├── FileUpload (document)
├── ImageUpload (image)
├── Is Active checkbox + Buttons

CustomersPage
├── PageHeader (with Add Customer button)
├── DataTable
│   └── View / Edit / Delete action buttons

CustomerDetailPage
├── PageHeader (with Edit button)
├── ProfileCard
│   ├── Image / Avatar
│   ├── Name, ID, Status
│   └── Quick Stats
├── InfoCard (2-col grid of fields)
└── DocumentsCard (download link)
```
