### Task 6: About (merged with Values)

**Files:**
- Modify: `frontend/src/components/sections/About.jsx`

- **Step 1: Rewrite About.jsx**

Two-column split layout:
- **Left (1/2)**: Full-height image (lifestyle interior with natural light)
  - Image: `https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80`
  - `h-full w-full object-cover rounded-none` (full-height, flush)
- **Right (1/2)**: Content stack with generous padding `p-12 md:p-16`:
  - "Our Story" in gold small label: `<span className="text-gold text-sm font-semibold tracking-[0.2em] uppercase">Our Story</span>`
  - Main heading: "Crafting Pakistan's finest living spaces" in Playfair Display (`font-serif text-4xl md:text-5xl leading-tight font-medium`)
  - 2 paragraphs of narrative text in Inter, text-gray-500 leading-relaxed
  - **Values inline**: 3-column grid of values — Integrity, Reliability, Innovation
    - Each: small icon (Shield, Users, Lightbulb from lucide-react), label in Inter semibold, one-line descriptor
    - No cards — just text with subtle left border accent (`border-l-2 border-gold pl-4`)

```jsx
import { Shield, Users, Lightbulb } from 'lucide-react';

const values = [
  { icon: Shield, label: 'Integrity', desc: 'Ethics and transparency in every deal' },
  { icon: Users, label: 'Reliability', desc: 'Trusted by 2,000+ families' },
  { icon: Lightbulb, label: 'Innovation', desc: 'Modern design meets timeless quality' },
];
```

Section background: white background, no section title needed (the heading is part of the content).
Remove animation/observer imports (keep it simple and static for now - no scroll animations).

- **Step 2: Build to verify**

Run: `cd frontend; npm run build`
Expected: Build succeeds

- **Step 3: Commit**

```bash
git add frontend/src/components/sections/About.jsx
git commit -m "feat: redesign about — image split, values inline, editorial typography"
```
