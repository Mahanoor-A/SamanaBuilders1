### Task 3: Hero — split layout with grounded registration panel

**Files:**
- Modify: `frontend/src/components/sections/Hero.jsx`

- **Step 1: Rewrite Hero.jsx**

Layout: Full-screen, 60/40 split:
- Background: single cinematic property image (golden hour luxury villa)
- Overlay: gradient bottom-heavy dark overlay (navy `#0c1f33` → transparent)
- **Left (60%)**:
  - Gold badge: "Now Accepting Bookings" — small rounded pill with gold bg
  - Headline: "Building Dreams, Delivering Trust" — Playfair Display, italic gold accent on "Delivering Trust"
  - Subtitle: "Samana Builders — premium real estate in Pakistan since 2011"
  - CTA: "Explore Properties" — solid navy rounded button with gold hover
- **Right (40%)**:
  - "Register Your Interest" panel
  - Dark background: `rgba(12, 31, 51, 0.85)` with subtle gold border
  - Fields: Name, Email, Phone — white text on transparent bg, white borders
  - Submit button: gold background
  - Privacy note: tiny text at bottom
  - NOT floating — grounded, flush within the section

```jsx
// Right panel structure
<div className="p-8 rounded-2xl" style={{ background: 'rgba(12,31,51,0.85)', border: '1px solid rgba(201,168,76,0.3)' }}>
  <h3 className="font-serif text-2xl font-semibold text-white mb-1">Register Your Interest</h3>
  ...
</div>
```

- **Step 2: Build to verify**

Run: `cd frontend; npm run build`
Expected: Build succeeds, no errors

- **Step 3: Commit**

```bash
git add frontend/src/components/sections/Hero.jsx
git commit -m "feat: redesign hero — split layout, grounded panel, editorial feel"
```
