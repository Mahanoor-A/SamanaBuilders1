# Corporate Website Redesign — Emaar-Inspired Luxury

**Date:** 2026-07-28
**Scope:** Corporate website homepage only (not ERP)
**Design direction:** Emaar Pakistan-inspired minimal luxury real estate aesthetic

---

## Problem Statement

The current corporate website has a dark/muddy navbar due to adaptive CSS `color-mix()` blending, inconsistent section styling, and an overall dated feel. The goal is to modernize the entire corporate website with a clean, luxury real estate aesthetic inspired by pk.emaar.com.

## Design Principles

1. **White-first:** Default backgrounds are white or very light gray. Primary color used sparingly for CTAs and accents only.
2. **Generous whitespace:** Large section padding (py-20 to py-28), breathing room between elements.
3. **Clean typography:** Large headings (Poppins), clean body text (Inter), clear visual hierarchy.
4. **No dark glass effects:** Remove all `color-mix()` + `backdrop-filter` glassmorphism on the navbar and light sections.
5. **Consistent containers:** All sections use `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`.

---

## Section-by-Section Design

### 1. Navbar (`src/components/layout/Navbar.jsx`)

**Current issue:** `color-mix(in srgb, ${theme.colors.surface} 95%, transparent)` + `backdrop-filter: blur(12px)` creates dark glass.

**New design:**
- **Default (top):** Fully transparent background, white text (since hero is dark)
- **Scrolled:** Solid white background with subtle `box-shadow: 0 1px 3px rgba(0,0,0,0.1)`, dark text
- Logo: `<span class="font-display font-bold">Samana</span> <span class="text-primary font-display font-bold">Builders</span>` — no icon background box
- Nav links: Simple text, `text-gray-600` default, `text-primary` on active/hover
- Right side: Phone text + "Book Now" button (primary gradient, small rounded)
- Mobile menu: White background slide-down, clean links
- **Remove:** Building2 icon box, WhatsApp button from nav, `scrolled` glass effect

### 2. Hero (`src/components/sections/Hero.jsx`)

**New design:**
- Full-screen single background image (keep Unsplash URL, remove slideshow)
- Dark gradient overlay (bottom-heavy: `from-black/70 via-black/30 to-transparent`)
- Centered content:
  - Large heading: "Building Dreams, Delivering Trust" — white, Poppins bold, `text-5xl md:text-7xl`
  - Subtitle: "Premium real estate development creating iconic residential and commercial spaces across Pakistan." — white/70, `text-lg md:text-xl`
  - Two buttons: "Explore Projects" (solid primary gradient) + "Contact Us" (white border outline)
- Scroll-down chevron at bottom center
- **Remove:** Slideshow logic, slide indicators, floating decorative circles, badge with Sparkles icon, complex `renderHeading` gradient text function
- **Simplify:** One static image, clean centered text, two CTAs

### 3. StatsBar (`src/components/sections/StatsBar.jsx`)

**New design:**
- White card with `shadow-lg rounded-2xl` overlapping hero bottom (`-mt-16`)
- 4-column grid with clean dividers (`border-r border-gray-100`)
- Each stat: Large number (`text-3xl font-display font-bold text-gray-900`) + label (`text-sm text-gray-500`)
- Remove: dark background (`theme.colors.text.DEFAULT`), icon containers, complex styling
- **Key:** Clean white card, just numbers and labels

### 4. About (`src/components/sections/About.jsx`)

**New design:**
- White background
- Clean section heading: "About Samana Builders" with small accent bar above
- Two-column grid:
  - Left: Heading "Crafting Excellence in Real Estate" + two paragraphs + 3 stats row
  - Right: Large rounded image with subtle shadow
- Remove: Floating "A+ Grade" card, inconsistent container classes
- Use consistent `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`
- Fix: `useTheme()` destructuring (already fixed)

### 5. WhatWeDo (`src/components/sections/WhatWeDo.jsx`)

**New design:**
- Light gray background (`bg-gray-50` or `bg-[theme.colors.background]`)
- Section heading: "Our Services"
- 3-column grid of clean white cards:
  - Each card: Icon/illustration area at top (light primary background), title, description, "Learn More →" link
  - Cards: `bg-white rounded-2xl shadow-sm border border-gray-100 p-8`
- Remove: Background image cards with dark gradient overlays
- Fix: `useTheme()` destructuring (already fixed)

### 6. FeaturedProjects (`src/components/sections/FeaturedProjects.jsx`)

**New design:**
- White background
- Section heading: "Our Projects"
- 3-column grid of project cards:
  - Each card: Image on top (rounded top), content below
  - Content: Title, location subtitle, brief description
  - Badge: Clean pill tag (e.g., "New Launch") positioned on image
  - Card: `bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden`
  - Hover: Subtle shadow increase, image slight zoom
- Remove: Dark gradient overlays, hover-reveal "Learn More", complex badge styling
- Keep: API project fetching (graceful error handling already in place)

### 7. CoreValues (`src/components/sections/CoreValues.jsx`)

**New design:**
- Keep dark background (brand primary color — this is the contrast section)
- Section heading: "Our Values" (white, light variant)
- 5-column grid of value cards:
  - Each card: Icon (primary.lighter color) + title + short description
  - Cards: Semi-transparent white background, subtle border
- Remove: Background blur decorative elements
- **Key:** Clean card grid on dark background

### 8. Testimonials (`src/components/sections/Testimonials.jsx`)

**New design:**
- Light background (`bg-gray-50`)
- Section heading: "What Our Clients Say"
- 3-column grid of testimonial cards:
  - Each card: Small quote icon (primary color), star rating (5 stars), quote text, author name + role
  - Cards: `bg-white rounded-2xl shadow-sm border border-gray-100 p-8`
- Remove: Large decorative quote icon

### 9. Newsletter (`src/components/sections/Newsletter.jsx`)

**New design:**
- Primary gradient background (`theme.gradients.primary`)
- Centered content: "Stay Updated" heading + subtitle
- Clean email input + "Subscribe" button inline
- Remove: Complex styling, keep minimal

### 10. Contact (`src/components/sections/Contact.jsx`)

**New design:**
- White background
- Two-column layout:
  - Left: Contact form (name, email, phone, message) with clean labeled inputs
  - Right: Contact info list (address, phone, email, hours) + WhatsApp button
- Form inputs: Clean border style, `rounded-xl`, focus ring in primary color
- Remove: Success state animation (keep simple success message)

### 11. Footer (`src/components/layout/Footer.jsx`)

**New design:**
- Fixed dark background: `bg-gray-900` (not theme-dependent)
- 4-column grid: Brand description, Quick Links, Services, Contact Info
- Social links row under brand
- Bottom bar: Copyright + Privacy Policy / Terms
- **Key:** Use fixed `bg-gray-900` instead of `theme.colors.text.DEFAULT`

---

## Global Changes

### Typography
- Headings: Poppins, font-weight 700, larger sizes (text-3xl to text-5xl for section headings)
- Body: Inter, font-weight 400, `leading-relaxed`
- Section headings: Consistent style with small accent bar + title + subtitle pattern

### Spacing
- Section padding: `py-20 md:py-28` (increased from `py-16 md:py-24`)
- Between heading and content: `mt-12` to `mt-16`
- Card padding: `p-8` (generous)

### Colors
- Primary: Used only for CTAs, links, active states, accent bars
- Backgrounds: White (`#ffffff`) or light gray (`#f8fafc`)
- Text: Charcoal (`#1e293b`) for headings, gray (`#64748b`) for body/muted
- Cards: White with subtle border (`border-gray-100`) and shadow

### Components to Remove/Archive
- `src/components/layout/ThemeSwitcher.jsx` — Remove from website (not needed)
- `src/components/sections/Services.jsx` — Orphaned, not in HomePage
- `src/components/sections/WhyChooseUs.jsx` — Orphaned, not in HomePage
- `src/components/sections/ComingSoonProjects.jsx` — Orphaned, not in HomePage
- `src/components/ui/Button.jsx` — Never used, can remove or keep for future

### Files to Modify
1. `src/components/layout/Navbar.jsx` — Complete rewrite
2. `src/components/layout/Footer.jsx` — Update background, clean up
3. `src/components/sections/Hero.jsx` — Complete rewrite (remove slideshow)
4. `src/components/sections/StatsBar.jsx` — Simplify to white card
5. `src/components/sections/About.jsx` — Clean up layout, fix theme access
6. `src/components/sections/WhatWeDo.jsx` — New card-based layout
7. `src/components/sections/FeaturedProjects.jsx` — Clean card layout
8. `src/components/sections/CoreValues.jsx` — Clean up decorative elements
9. `src/components/sections/Testimonials.jsx` — Simplify cards
10. `src/components/sections/Newsletter.jsx` — Simplify
11. `src/components/sections/Contact.jsx` — Clean form styling
12. `src/index.css` — Update CSS variables, remove unused ERP styles if needed
13. `tailwind.config.js` — Possibly add `gray` color scale if needed

### What Stays the Same
- `App.jsx` structure (Navbar + HomePage + Footer)
- `main.jsx` (ThemeProvider wrapping)
- `ThemeContext.jsx` / `useTheme.js` — Keep theme system
- `src/themes/` — Keep all theme files
- `src/services/api.js` — Keep API layer
- All ERP pages/components — Out of scope
- `src/pages/HomePage.jsx` — Section order stays the same
