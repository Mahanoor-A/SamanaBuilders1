# React Frontend Design — Samana Builders Marketing Website

**Date:** 2026-07-24
**Status:** Approved
**Scope:** Initialize React frontend in `frontend/` directory with Vite, Tailwind CSS, React Router, Axios. Build responsive marketing website with 5-theme switcher. Keep Django ERP templates untouched.

---

## 1. Project Structure & Architecture

```
frontend/
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── public/
│   └── goldcity.jpeg
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── index.css                    # Tailwind directives + CSS variables for themes
│   ├── contexts/
│   │   └── ThemeContext.jsx         # Theme state + localStorage persistence
│   ├── themes/
│   │   ├── index.js                 # Exports all themes
│   │   ├── professionalBlue.js
│   │   ├── modernGreen.js
│   │   ├── elegantDark.js
│   │   ├── warmEarth.js
│   │   └── minimalistPurple.js
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Navbar.jsx
│   │   │   ├── Footer.jsx
│   │   │   └── ThemeSwitcher.jsx
│   │   ├── sections/
│   │   │   ├── Hero.jsx
│   │   │   ├── About.jsx
│   │   │   ├── Services.jsx
│   │   │   ├── WhyChooseUs.jsx
│   │   │   ├── ComingSoonProjects.jsx
│   │   │   └── Contact.jsx
│   │   └── ui/
│   │       ├── Button.jsx
│   │       ├── Card.jsx
│   │       └── SectionHeading.jsx
│   ├── pages/
│   │   └── HomePage.jsx
│   ├── hooks/
│   │   └── useTheme.js
│   └── services/
│       └── api.js                   # Axios instance + DRF API calls
```

**Tech stack:**
- Vite + React 18
- React Router v6
- Tailwind CSS v3
- Axios

**Dev server:** Port 5173 (Vite) with proxy to Django on port 8000.

**Django ERP templates remain untouched.** The React app is a separate SPA for the marketing/corporate website.

---

## 2. Theme System Design

### Approach: CSS Variables + React Context

Each theme defines a JS object with semantic color tokens. The ThemeContext provider applies these as CSS custom properties on `:root`. Tailwind CSS is configured to reference these variables.

### Theme Object Shape

```js
{
  name: "Professional Blue",
  id: "professional-blue",
  colors: {
    primary: { DEFAULT: "#1e3a5f", light: "#2d5a87", lighter: "#94b8d4" },
    background: "#f0f4f8",
    surface: "#ffffff",
    text: { DEFAULT: "#334155", muted: "#64748b" },
    border: "#e2e8f0",
    accent: { success: "#10b981", warning: "#f59e0b", danger: "#ef4444" },
  },
  gradients: {
    primary: "linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%)",
  }
}
```

### Theme Definitions (extracted from themes/ HTML files)

| Theme | Primary | Light | Lighter | Background | Surface |
|-------|---------|-------|---------|------------|---------|
| Professional Blue | #1e3a5f | #2d5a87 | #94b8d4 | #f0f4f8 | #ffffff |
| Modern Green | #14532d | #166534 | #86efac | #f0fdf4 | #ffffff |
| Elegant Dark | #6366f1 | #8b5cf6 | #a5b4fc | #0f172a | #1e293b |
| Warm Earth | #78350f | #92400e | #fcd34d | #fef7ed | #ffffff |
| Minimalist Purple | #581c87 | #7c3aed | #d8b4fe | #faf5ff | #ffffff |

### CSS Variable Mapping

Applied to `:root` via JavaScript when theme changes:

```css
--color-primary: #1e3a5f;
--color-primary-light: #2d5a87;
--color-primary-lighter: #94b8d4;
--color-bg: #f0f4f8;
--color-surface: #ffffff;
--color-text: #334155;
--color-text-muted: #64748b;
--color-border: #e2e8f0;
--color-accent-success: #10b981;
--color-accent-warning: #f59e0b;
--color-accent-danger: #ef4444;
--gradient-primary: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%);
```

### Tailwind Config Extension

```js
colors: {
  primary: { DEFAULT: "var(--color-primary)", light: "var(--color-primary-light)", lighter: "var(--color-primary-lighter)" },
  bg: "var(--color-bg)",
  surface: "var(--color-surface)",
  "text-main": "var(--color-text)",
  "text-muted": "var(--color-text-muted)",
  border: "var(--color-border)",
  "accent-success": "var(--color-accent-success)",
  "accent-warning": "var(--color-accent-warning)",
  "accent-danger": "var(--color-accent-danger)",
}
```

### ThemeContext

- `useTheme()` hook returns `{ theme, setTheme, themes }`
- On theme change: updates CSS variables on `document.documentElement`
- Persists choice to `localStorage` under key `sabana-theme`
- On initial load: reads from localStorage, defaults to Professional Blue

### ThemeSwitcher Component

- Dropdown or button group in the Navbar
- Shows current theme name
- Lists all 5 themes for selection
- Visual indicator (color dot or swatch) next to each theme name

---

## 3. Landing Page Sections

Single-page scroll with these sections:

### 3.1 Navbar
- Fixed top, transparent background that becomes solid on scroll
- Logo: text "Samana Builders" with a small building icon
- Nav links: Home, About, Services, Projects, Contact
- ThemeSwitcher component
- WhatsApp CTA button
- Hamburger menu on mobile

### 3.2 Hero
- Full viewport height
- Headline: "Building Dreams, Delivering Trust"
- Subtext: Brief description of Samana Builders & Developers
- CTA buttons: "View Projects" (scrolls to projects section) and "Contact Us" (scrolls to contact)
- Background: gradient overlay on a construction/real-estate themed image (placeholder initially)

### 3.3 About
- Two-column layout (stacked on mobile)
- Left: Company story, founding, mission, values
- Right: Stat counters (Projects Completed, Happy Clients, Years of Experience)

### 3.4 Services
- Grid of 6 service cards (1 col mobile, 2 col tablet, 3 col desktop)
- Services: Residential Construction, Commercial Projects, Interior Design, Property Management, Investment Consulting, Legal Advisory
- Each card: icon, title, short description

### 3.5 Why Choose Us
- 4 feature cards in a row (2x2 on mobile)
- Quality Assurance, Timely Delivery, Transparent Pricing, Expert Team
- Each: icon, title, description

### 3.6 Coming Soon Projects
- Featured project card for **Samana Gold City**
- Image: `goldcity.jpeg` (copied to `public/`)
- Project name, brief description, "Coming Soon" badge
- CTA to contact for details

### 3.7 Contact
- Two-column layout (stacked on mobile)
- Left: Contact form (Name, Email, Phone, Message, Submit)
- Right: Company address, phone, email, WhatsApp link, Google Maps embed placeholder
- Form submits to DRF customers API endpoint

### 3.8 Footer
- Multi-column: Company info, quick links, services list, contact details
- Copyright bar: "© 2026 Samana Builders & Developers (Pvt.) Ltd."
- Social media icon placeholders

---

## 4. API Integration & Services

### Axios Instance (`services/api.js`)

- Base URL: `/api/` (proxied via Vite to Django on port 8000)
- Session authentication (cookies from Django)
- Interceptors for error handling

### Vite Proxy Config

```js
server: {
  proxy: {
    '/api': 'http://localhost:8000',
  }
}
```

### API Endpoints Used

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/projects/` | GET | Fetch projects for Coming Soon section |
| `/api/customers/` | POST | Submit contact form as a lead |
| `/api/auth/` | GET/POST | Authentication (future use) |

### Contact Form

- Posts to `/api/customers/` with name, email, phone, message
- Shows success/error toast notification
- Validates required fields client-side

---

## 5. Responsive Design & Polish

### Breakpoints (Tailwind defaults)

- `sm` (640px): Stack two-column layouts
- `md` (768px): Adjust grid columns, font sizes
- `lg` (1024px): Full desktop layout
- `xl` (1280px): Max-width container

### Responsive Behaviors

- **Navbar:** Hamburger menu on mobile, full links on desktop
- **Hero:** Stacked layout on mobile, full-width on desktop
- **Service cards:** 1 column mobile, 2 columns tablet, 3 columns desktop
- **Contact form:** Stacked on mobile, side-by-side on desktop
- **Footer:** Single column mobile, multi-column desktop

### Animations

- Subtle fade-in on scroll for sections (CSS `@keyframes` + Intersection Observer)
- No heavy JS animation libraries
- Smooth scroll for anchor links

### WhatsApp Floating Button

- Fixed bottom-right corner
- Visible on all pages
- Links to `https://wa.me/<number>` (placeholder number)

### SEO

- Proper `<meta>` tags (title, description, keywords)
- Open Graph tags for social sharing
- Semantic HTML (`<section>`, `<article>`, `<nav>`, `<header>`, `<footer>`)

---

## 6. Constraints & Non-Goals

- **ERP templates untouched** — Django templates in `templates/` remain as-is
- **No ERP React migration** — This is marketing website only
- **No authentication UI** — Login/signup not in scope for this phase
- **No admin dashboard** — That's the Django ERP's job
- **Theme switcher on marketing site only** — Not on ERP pages

---

## 7. File Inventory

### New Files to Create

| File | Purpose |
|------|---------|
| `frontend/package.json` | Dependencies and scripts |
| `frontend/vite.config.js` | Vite config with proxy |
| `frontend/tailwind.config.js` | Tailwind config with theme colors |
| `frontend/postcss.config.js` | PostCSS config |
| `frontend/index.html` | HTML entry point |
| `frontend/src/main.jsx` | React entry point |
| `frontend/src/App.jsx` | App with router |
| `frontend/src/index.css` | Tailwind directives + CSS variables |
| `frontend/src/contexts/ThemeContext.jsx` | Theme context provider |
| `frontend/src/themes/*.js` | 5 theme definitions |
| `frontend/src/components/**/*.jsx` | All components |
| `frontend/src/pages/HomePage.jsx` | Home page |
| `frontend/src/hooks/useTheme.js` | Theme hook |
| `frontend/src/services/api.js` | Axios instance |
| `frontend/public/goldcity.jpeg` | Project image (copy from root) |

### Existing Files Modified

None. All changes are within `frontend/`.
