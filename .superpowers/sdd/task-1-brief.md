### Task 1: Update index.html + tailwind.config.js + index.css (Foundations)

**Files:**
- Modify: `frontend/index.html`
- Modify: `frontend/tailwind.config.js`
- Modify: `frontend/src/index.css`

- **Step 1: Update index.html — update fonts, title, meta**

```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,500;1,600;1,700&display=swap" rel="stylesheet" />
<title>Samana Builders & Developers | Premium Real Estate</title>
```

- **Step 2: Update tailwind.config.js — add gold, Playfair Display**

```js
// In theme.extend.colors:
gold: '#c9a84c',

// In theme.extend.fontFamily:
serif: ['Playfair Display', 'Georgia', 'serif'],
```

- **Step 3: Update index.css — remove glassmorphism, add gold, tighten defaults**

```css
/* Remove erp-card backdrop-filter/blur */
/* Change h1-h6 font-family to use Playfair Display */
/* Add .font-serif for Playfair Display */
/* Reduce default section-padding */
```

- **Step 4: Build to verify**

Run: `cd frontend; npm run build`
Expected: Build succeeds, no errors

- **Step 5: Commit**

```bash
git add frontend/index.html frontend/tailwind.config.js frontend/src/index.css
git commit -m "feat: update foundations — fonts, colors, CSS for real estate redesign"
```
