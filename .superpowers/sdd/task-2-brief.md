### Task 2: Navbar — grounded, clean, glassmorphism-free

**Files:**
- Modify: `frontend/src/components/layout/Navbar.jsx`
- Modify: `frontend/src/components/layout/ThemeSwitcher.jsx`

**Interfaces:**
- Consumes: ThemeSwitcher renders theme palette icon
- Produces: Navbar with transparent → white/90 backdrop-blur on scroll, ThemeSwitcher as palette icon

- **Step 1: Rewrite Navbar.jsx**

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

- **Step 2: Update ThemeSwitcher.jsx — icon-only mode**

Add `iconOnly` prop. When true, only show the palette icon (no theme name, no chevron). The dropdown still works.

- **Step 3: Build to verify**

Run: `cd frontend; npm run build`
Expected: Build succeeds, no errors

- **Step 4: Commit**

```bash
git add frontend/src/components/layout/Navbar.jsx frontend/src/components/layout/ThemeSwitcher.jsx
git commit -m "feat: redesign navbar — grounded, glassmorphism-free, icon-only theme switcher"
```
