# Real Estate Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the Samana Builders corporate website from a tech/SaaS look to a premium real estate editorial feel.

**Architecture:** Single-page React app with scroll-based navigation. 10 sections rearranged with tighter padding, Playfair Display for editorial headings, navy/gold color scheme, grounded layouts instead of glassmorphism.

**Tech Stack:** Vite + React 18 + Tailwind CSS + Playfair Display + Inter + lucide-react

**Global Constraints:**
- Navy `#0c1f33` primary, Rich Blue `#1a365d`, Estate Gold `#c9a84c` accent
- Playfair Display for all major headings and section titles
- No glassmorphism, no floating elements, no star ratings
- Tighter padding: `py-16` default instead of `py-20 md:py-28`
- All images from Unsplash luxury real estate collection
- Theme system (5 themes) preserved, ThemeSwitcher as palette icon in navbar

---

### Task 1: Update index.html + tailwind.config.js + index.css (Foundations)

**Files:**
- Modify: `frontend/index.html`
- Modify: `frontend/tailwind.config.js`
- Modify: `frontend/src/index.css`

- [ ] **Step 1: Update index.html — update fonts, title, meta**

```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,500;1,600;1,700&display=swap" rel="stylesheet" />
<title>Samana Builders & Developers | Premium Real Estate</title>
```

- [ ] **Step 2: Update tailwind.config.js — add gold, Playfair Display**

```js
// In theme.extend.colors:
gold: '#c9a84c',

// In theme.extend.fontFamily:
serif: ['Playfair Display', 'Georgia', 'serif'],
```

- [ ] **Step 3: Update index.css — remove glassmorphism, add gold, tighten defaults**

```css
/* Remove erp-card backdrop-filter/blur */
/* Change h1-h6 font-family to use Playfair Display */
/* Add .font-serif for Playfair Display */
/* Reduce default section-padding */
```

- [ ] **Step 4: Build to verify**

Run: `cd frontend; npm run build`
Expected: Build succeeds, no errors

- [ ] **Step 5: Commit**

```bash
git add frontend/index.html frontend/tailwind.config.js frontend/src/index.css
git commit -m "feat: update foundations — fonts, colors, CSS for real estate redesign"
```

---

### Task 2: Navbar — grounded, clean, glassmorphism-free

**Files:**
- Modify: `frontend/src/components/layout/Navbar.jsx`
- Modify: `frontend/src/components/layout/ThemeSwitcher.jsx`

**Interfaces:**
- Consumes: ThemeSwitcher renders theme palette icon
- Produces: Navbar with transparent → white/90 backdrop-blur on scroll, ThemeSwitcher as palette icon

- [ ] **Step 1: Rewrite Navbar.jsx**

Navbar structure:
```
[Logo: Playfair Display "Samana Builders"]  [Home] [Communities] [About] [Projects] [Services] [Contact]  [🌐] [0800-12345] [Book Now]
```

Key states:
- **At top**: `bg-transparent`, all text white, no shadow
- **On scroll (>50px)**: `bg-white/90 backdrop-blur-md`, charcoal text, subtle bottom border `border-b border-gray-100`
- Active link: gold underline/bottom border
- ThemeSwitcher: palette icon only (no text label), positioned in right cluster
- Mobile: hamburger → full-height overlay with links + theme switcher + Book Now CTA

```jsx
// Key parts:
const [scrolled, setScrolled] = useState(false);
// scroll listener

<nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
  scrolled ? 'bg-white/90 backdrop-blur-md border-b border-gray-100' : 'bg-transparent'
}`}>
```

- [ ] **Step 2: Update ThemeSwitcher.jsx — icon-only mode**

Add `iconOnly` prop. When true, only show the palette icon (no theme name, no chevron). The dropdown still works.

- [ ] **Step 3: Build to verify**

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/layout/Navbar.jsx frontend/src/components/layout/ThemeSwitcher.jsx
git commit -m "feat: redesign navbar — grounded, glassmorphism-free, icon-only theme switcher"
```

---

### Task 3: Hero — split layout with grounded registration panel

**Files:**
- Modify: `frontend/src/components/sections/Hero.jsx`

- [ ] **Step 1: Rewrite Hero.jsx**

Layout: Full-screen, 60/40 split:
- Background: single cinematic property image (golden hour luxury villa)
- Overlay: gradient bottom-heavy dark overlay (navy `#0c1f33` → transparent)
- **Left (60%)**:
  - Gold badge: "Now Accepting Bookings" — small rounded pill
  - Headline: "Building Dreams, Delivering Trust" — Playfair Display, italic gold accent on "Delivering Trust"
  - Subtitle: "Samana Builders — premium real estate in Pakistan since 2011"
  - CTA: "Explore Properties" — solid navy rounded button with gold hover
- **Right (40%)**:
  - "Register Your Interest" panel
  - Dark background: `rgba(12, 31, 51, 0.85)` with subtle gold border
  - Fields: Name, Email, Phone — white text on transparent bg, white borders
  - Submit button: gold background
  - Privacy note: tiny text at bottom
  - NOT floating — grounded, flush to right edge

```jsx
// Right panel structure
<div className="p-8 rounded-2xl" style={{ background: 'rgba(12,31,51,0.85)', border: '1px solid rgba(201,168,76,0.3)' }}>
  <h3 className="font-serif text-2xl font-semibold text-white mb-1">Register Your Interest</h3>
  ...
</div>
```

- [ ] **Step 2: Build to verify**

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/sections/Hero.jsx
git commit -m "feat: redesign hero — split layout, grounded panel, editorial feel"
```

---

### Task 4: Lead Strip + StatsBar

**Files:**
- Create: `frontend/src/components/sections/LeadStrip.jsx`
- Modify: `frontend/src/components/sections/StatsBar.jsx`
- Modify: `frontend/src/pages/HomePage.jsx`

- [ ] **Step 1: Create LeadStrip.jsx**

Full-width band, navy background, tight padding:
```
┌────────────────────────────────────────────────────┐
│  "Stay Updated on New Launches"  [Name] [Email] [→] │
└────────────────────────────────────────────────────┘
```
- Left: Playfair Display heading
- Right: inline form (Name + Email + Gold Subscribe button)

```jsx
export default function LeadStrip() {
  return (
    <section className="py-8" style={{ background: '#0c1f33' }}>
      <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <h3 className="font-serif text-xl text-white">Stay Updated on New Launches</h3>
        <form className="flex gap-3">...</form>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Rewrite StatsBar.jsx**

Remove the big card/shadow. Make it a clean row:
- White background, `py-12`
- 4 stats in a grid with dividers
- Numbers in Inter bold, labels in small Inter
- No icons (or very subtle small icons)

- [ ] **Step 3: Update HomePage.jsx order**

```
Hero → LeadStrip → StatsBar → FeaturedCommunities → LatestLaunches → About → Services → FeaturedProjects → Testimonials → Contact
```

Remove CoreValues import.

- [ ] **Step 4: Delete CoreValues.jsx** (merged into About)

- [ ] **Step 5: Build to verify**

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/sections/LeadStrip.jsx frontend/src/components/sections/StatsBar.jsx frontend/src/pages/HomePage.jsx
git rm frontend/src/components/sections/CoreValues.jsx
git commit -m "feat: add lead capture strip, simplify stats bar, update section order"
```

---

### Task 5: Featured Communities + Latest Launches

**Files:**
- Modify: `frontend/src/components/sections/FeaturedCommunities.jsx`
- Modify: `frontend/src/components/sections/LatestLaunches.jsx`

- [ ] **Step 1: Tweak FeaturedCommunities.jsx**

- Replace glassmorphism badges with solid gold badges (`bg-gold`)
- Community names in Playfair Display italic
- Tighter padding: `py-16`
- Remove glassmorphism from "Learn More" button — use outlined white style

- [ ] **Step 2: Rewrite LatestLaunches.jsx as directory-style**

Replace 4-column cards with horizontal rows:
- Alternating bg: white / warm gray
- Image left (3:2 ratio, `w-1/3`)
- Content right: community name (small uppercase, muted), project name (Playfair Display), tagline (italic), "Learn More" gold link
- 4 items

```jsx
{launches.map((item, i) => (
  <div key={item.id} className={`flex ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
    <div className="w-1/3">
      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
    </div>
    <div className="w-2/3 p-8 flex flex-col justify-center">
      <p className="text-xs uppercase tracking-wider text-gray-400 mb-1">{item.community}</p>
      <h3 className="font-serif text-2xl font-semibold text-gray-900 mb-1">{item.name}</h3>
      <p className="font-serif italic text-gray-500 mb-4">{item.tagline}</p>
      <a href="#" className="text-gold font-semibold text-sm hover:underline">Learn More →</a>
    </div>
  </div>
))}
```

- [ ] **Step 3: Build to verify**

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/sections/FeaturedCommunities.jsx frontend/src/components/sections/LatestLaunches.jsx
git commit -m "feat: redesign communities and launches — gold badges, directory-style launches"
```

---

### Task 6: About (merged with Values)

**Files:**
- Modify: `frontend/src/components/sections/About.jsx`

- [ ] **Step 1: Rewrite About.jsx**

Two-column split:
- **Left**: Full-height image (lifestyle interior with natural light, e.g. unsplash `1600607687939-ce8a6c25118c`)
- **Right**: Content stack:
  - "Our Story" in gold small label
  - "Crafting Pakistan's finest living spaces" in Playfair Display
  - 2 paragraphs of narrative text in Inter
  - Values row: 3-column grid — Integrity, Reliability, Innovation
    - Small icon (from lucide), label in Inter semibold, short descriptor
    - No cards, just text with subtle top border accent

- [ ] **Step 2: Build to verify**

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/sections/About.jsx
git commit -m "feat: redesign about — image split, values inline, editorial typography"
```

---

### Task 7: Services

**Files:**
- Modify: `frontend/src/components/sections/Services.jsx`

- [ ] **Step 1: Rewrite Services.jsx**

Standalone section, warm gray background:
- Section title "Our Services" in Playfair Display, centered
- 3-column grid of 6 services:
  - Residential Development
  - Commercial Projects
  - Property Management
  - Real Estate Advisory
  - Interior Design
  - After-Sales Support
- Each: small icon (lucide), title (Inter semibold), short description (Inter regular, muted)
- Clean, minimal, no cards/shadows
- `py-16`

- [ ] **Step 2: Build to verify**

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/sections/Services.jsx
git commit -m "feat: redesign services — clean grid, no cards, editorial styling"
```

---

### Task 8: Featured Projects + Testimonials

**Files:**
- Modify: `frontend/src/components/sections/FeaturedProjects.jsx`
- Modify: `frontend/src/components/sections/Testimonials.jsx`

- [ ] **Step 1: Tweak FeaturedProjects.jsx**

- Section title "Our Developments" in Playfair Display
- Keep overlay card design but:
  - Gold badge instead of glassmorphism
  - Project name in Playfair Display
  - Remove glassmorphism from overlay button

- [ ] **Step 2: Rewrite Testimonials.jsx**

Single testimonial centered:
- Large quote in Playfair Display italic (~24px)
- Name + location in Inter small below
- 3-4 testimonials, dot navigation
- No star ratings
- Warm gray background, `py-16`

```jsx
const testimonials = [
  { quote: "Samana Builders delivered beyond our expectations...", name: "Ahmed Riaz", location: "Lahore" },
  // ...
];
// State to track active index
// Show one at a time with fade transition
// Dot buttons at bottom
```

- [ ] **Step 3: Build to verify**

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/sections/FeaturedProjects.jsx frontend/src/components/sections/Testimonials.jsx
git commit -m "feat: update projects and testimonials — gold badges, editorial testimonials"
```

---

### Task 9: Contact + Newsletter (combined) + Footer tweaks

**Files:**
- Modify: `frontend/src/components/sections/Contact.jsx`
- Modify: `frontend/src/components/sections/Newsletter.jsx` (remove or merge)
- Modify: `frontend/src/components/layout/Footer.jsx`

- [ ] **Step 1: Rewrite Contact.jsx as combined section**

Navy background section:
- Left: "Get in Touch" — address, phone, email, quick text
- Right: "Newsletter" — "Join our mailing list" + inline email field + gold subscribe button
- Gold accent for dividers/headings
- White text, clean editorial feel

- [ ] **Step 2: Remove standalone Newsletter.jsx** (remove import from HomePage)

- [ ] **Step 3: Minor Footer tweaks**

- Use Playfair Display for logo tagline
- Ensure gold accent on links

- [ ] **Step 4: Build to verify**

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/sections/Contact.jsx frontend/src/components/layout/Footer.jsx
git rm frontend/src/components/sections/Newsletter.jsx
git commit -m "feat: combine contact+newsletter, update footer for editorial feel"
```

---

### Task 10: Final build + verification

- [ ] **Step 1: Full production build**

Run: `cd frontend; npm run build 2>&1`
Expected: Build succeeds, no errors or warnings

- [ ] **Step 2: Verify all sections render**

Check: Navbar at top transparent → white on scroll. Hero split layout. Lead strip below hero. Stats clean. Communities with gold badges. Launches as directory rows. About with values inline. Services grid. Projects overlay cards. Testimonials centered. Contact combined with newsletter. Footer clean.

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "feat: complete real estate website redesign — editorial feel, navy/gold palette"
```
