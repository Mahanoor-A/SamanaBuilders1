# Corporate Website — Real Estate Redesign

**Date:** 2026-07-28
**Project:** Samana Builders & Developers
**Status:** Approved Design

## Overview

Redesign the corporate website frontend from a tech/SaaS-looking UI to a premium real estate editorial feel — inspired by Emaar Pakistan (pk.emaar.com) and Imarat (imarat.com.pk). Middle ground between Emaar's clean elegance and Imarat's boldness.

## Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| Navy | `#0c1f33` | Primary, navbar, section backgrounds |
| Rich Blue | `#1a365d` | Primary light, hover states |
| Estate Gold | `#c9a84c` | Accent, badges, active links, underlines |
| White | `#ffffff` | Surfaces |
| Warm Gray | `#f7f5f0` | Light section backgrounds |
| Charcoal | `#1a1a1a` | Body text |
| Muted | `#6b7280` | Secondary text |

Gradients: Navy → Rich Blue for hero overlays and buttons.

## Typography

| Role | Font | Weight | Usage |
|------|------|--------|-------|
| Display/Editorial | Playfair Display | 400, 500, 600, 700 (regular + italic) | All major headings, section titles, testimonials, taglines |
| Body | Inter | 300, 400, 500, 600 | Body text, navbar links, small labels |
| Logo | Playfair Display | 700 | "Samana Builders" in navbar |
| Numerals | Inter | 600, 700 | Stats, prices, numbers |

## Section Flow (10 sections, reduced from 11)

```
Hero → Lead Strip → Stats → Communities → Launches → About (merged with Values) → Services → Projects → Testimonials → Contact+Newsletter → Footer
```

### 1. Navbar

- **Position**: Fixed top, z-50
- **States**:
  - **At top**: Transparent background, white text, no shadow
  - **On scroll (>50px)**: `bg-white/90 backdrop-blur-md`, charcoal text, subtle bottom border
- **Layout** (left to right):
  - Logo: "Samana Builders" in Playfair Display bold
  - Nav links: Home, Communities, About, Projects, Services, Contact — uppercase tracking, good spacing
  - Right cluster: ThemeSwitcher (palette icon only, no text), Phone number, "Book Now" button (navy bg, gold hover)
- **No glassmorphism** — clean, grounded, editorial
- Active section: gold underline
- **Mobile**: Hamburger icon → full-height overlay with centered links, theme switcher, and CTA

### 2. Hero

- **Layout**: Full-screen split — 60% editorial text left, 40% registration panel right
- **Background**: Single cinematic property image (golden hour luxury villa/interior, e.g. unsplash `1600585154340-be6161a56a0c`)
- **Overlay**: Gradient bottom-heavy dark overlay (navy → transparent)
- **Left side**:
  - Eyebrow: Small gold "Now Accepting Bookings" badge
  - Headline: "Building Dreams, Delivering Trust" in Playfair Display, italic gold accent on "Delivering Trust"
  - Subtitle: "Samana Builders — premium real estate in Pakistan since 2011"
  - CTA: "Explore Properties" — solid navy rounded button
- **Right side**:
  - "Register Your Interest" panel — grounded, not floating
  - Background: `rgba(12, 31, 51, 0.85)` dark panel with subtle border
  - Fields: Name, Email, Phone — white text on dark fields, transparent backgrounds
  - Submit button: Estate Gold background
  - Privacy note: tiny text at bottom
- **Scroll indicator**: Subtle bounce chevron at bottom center

### 3. Lead Capture Strip

- Full-width band, tight padding (`py-8`)
- Navy background (`#0c1f33`)
- Left: "Stay Updated on New Launches" in Playfair Display
- Right: Inline form — Name + Email + Subscribe button (gold)
- Minimal, non-intrusive

### 4. Stats Bar

- Full-width, minimal
- Four stats in a grid: Projects Completed (150+), Happy Families (2,000+), Years Experience (15+), Sq Ft Area (10M+)
- No card/shadow — just text with small icons
- Right-aligned numbers in Inter bold, labels in small Inter text
- Divider lines between stats
- `py-12`, white background

### 5. Featured Communities

- Section title "Featured Communities" in Playfair Display
- Grid of 2 large hero-style cards (same as current but):
  - Gold badge instead of glassmorphism
  - Community name in Playfair Display italic
  - Tighter padding: `py-16`
  - Image hover: scale + subtle gradient shift
  - "Learn More" button: outlined white

### 6. Latest Launches

- Section title "Latest Launches" in Playfair Display
- **Directory-style layout** (not cards): horizontal rows
  - Image left (3:2 ratio)
  - Content right: community name (small uppercase), project name (Playfair Display), tagline (Playfair Display italic), "Learn More" link
  - Alternating background: white / warm gray
- 4 launches (same data, new layout)

### 7. About (merged with Values)

- **Layout**: Two-column split (50/50)
  - **Left**: Full-height image (lifestyle interior with natural light)
  - **Right**: Content stack:
    - "Our Story" label in gold
    - "Crafting Pakistan's finest living spaces" in Playfair Display
    - 2-3 paragraph narrative (~100 words)
    - **Values inline**: 3-column grid (Integrity, Reliability, Innovation) — icon + label, no cards
- Background: white → warm gray band transition

### 8. Services

- Standalone section, warm gray background
- Section title "Our Services" in Playfair Display
- 3-column grid of service items:
  - Residential Development
  - Commercial Projects
  - Property Management
  - Real Estate Advisory
  - Interior Design
  - After-Sales Support
- Each: icon (small, clean), title (Inter semibold), short description (Inter regular, muted)
- Clean, minimal, no cards or shadows
- Tight padding: `py-16`

### 9. Featured Projects

- Section title "Our Developments" in Playfair Display
- Full-image overlay cards (current design works):
  - Gold badge
  - Project name in Playfair Display
  - Overlay gradient
  - "Explore" CTA overlay

### 10. Testimonials

- Single testimonial at a time (centered, editorial)
- Quote in Playfair Display italic (large, ~24px)
- Name + location below in small Inter text
- Dot navigation below
- No star ratings
- Background: warm gray
- Tight padding: `py-16`

### 11. Contact + Newsletter

- Combined section, navy background (`#0c1f33`)
- Two columns:
  - **Left**: "Get in Touch" — address, phone, email, quick contact text
  - **Right**: "Newsletter" — "Join our mailing list" + inline email field + gold subscribe button
- Gold accent for dividers/headings
- White text, clean editorial look

### 12. Footer

- Same structure as current (bg-gray-900)
- Use Playfair Display for logo tagline
- Clean link columns, social icons, copyright

## Implementation Notes

- **Images**: Use Unsplash luxury real estate photos (golden hour, natural light, interiors with warmth)
- **Animations**: Subtle fade-in-up on scroll, no floating/bouncing elements (except hero scroll indicator)
- **Theme system**: Keep existing 5 themes, ThemeSwitcher available in navbar as palette icon
- **Responsive**: Mobile-first, hero stacks vertically, launches become single column, about stacks
- **Font loading**: Playfair Display, Inter loaded from Google Fonts in index.html
