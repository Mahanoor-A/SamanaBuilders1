### Task 7: Services

**Files:**
- Modify: `frontend/src/components/sections/Services.jsx`

- **Step 1: Rewrite Services.jsx**

Standalone section, warm gray background:
- Section padding: `py-16`
- Background: `bg-gray-50`
- Section title "Our Services" in Playfair Display: `<h2 className="font-serif text-3xl md:text-4xl font-semibold text-center text-[#0c1f33] mb-12">Our Services</h2>`
- 3-column grid of 6 services:
  - Residential Development (Building2 icon)
  - Commercial Projects (Store icon)
  - Property Management (ShieldCheck icon)
  - Real Estate Advisory (Handshake icon)
  - Interior Design (Paintbrush icon)
  - After-Sales Support (Headphones icon)
- Each service item: icon centered, title (Inter semibold, text-[#0c1f33]), short description (Inter regular, text-gray-500)
- NO cards, NO shadows, NO borders around items — just clean text with icons
- Divided into two rows of 3 in a `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8`

```jsx
import { Building2, Store, ShieldCheck, Handshake, Paintbrush, Headphones } from 'lucide-react';

const services = [
  { icon: Building2, title: 'Residential Development', desc: 'Premium homes and villas in prime locations across Pakistan' },
  { icon: Store, title: 'Commercial Projects', desc: 'Modern retail and office spaces for thriving businesses' },
  { icon: ShieldCheck, title: 'Property Management', desc: 'End-to-end management for your real estate investments' },
  { icon: Handshake, title: 'Real Estate Advisory', desc: 'Expert guidance on property investment and development' },
  { icon: Paintbrush, title: 'Interior Design', desc: 'Award-winning design solutions for modern living' },
  { icon: Headphones, title: 'After-Sales Support', desc: 'Dedicated support long after your purchase is complete' },
];
```

- **Step 2: Build to verify**

Run: `cd frontend; npm run build`
Expected: Build succeeds

- **Step 3: Commit**

```bash
git add frontend/src/components/sections/Services.jsx
git commit -m "feat: redesign services — clean grid, no cards, editorial styling"
```
