### Task 4: Lead Strip + StatsBar + HomePage reorder

**Files:**
- Create: `frontend/src/components/sections/LeadStrip.jsx`
- Modify: `frontend/src/components/sections/StatsBar.jsx`
- Modify: `frontend/src/pages/HomePage.jsx`
- Delete: `frontend/src/components/sections/CoreValues.jsx`

- **Step 1: Create LeadStrip.jsx**

Full-width band, navy background, tight padding:
- Section with `py-8` and background `#0c1f33`, full-width (no max-width padding issue)
- Content: flex row, centered
- Left: "Stay Updated on New Launches" in Playfair Display (`font-serif text-xl text-white`)
- Right: inline form with Name + Email + Subscribe button
  - Form fields: transparent bg, white border, white text, white placeholder, rounded-lg, `px-4 py-2 text-sm`
  - Subscribe button: gold bg (`bg-gold`), white text, rounded-lg, px-6 py-2

```jsx
export default function LeadStrip() {
  return (
    <section className="py-10" style={{ background: '#0c1f33' }}>
      <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <h3 className="font-serif text-xl text-white text-center md:text-left">Stay Updated on New Launches</h3>
        <form className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto" onSubmit={...}>
          <input type="text" placeholder="Full Name" className="..." />
          <input type="email" placeholder="Email Address" className="..." required />
          <button type="submit" className="bg-gold text-white rounded-lg px-6 py-2 font-semibold text-sm hover:bg-gold/90 transition-colors">Subscribe</button>
        </form>
      </div>
    </section>
  );
}
```

- **Step 2: Rewrite StatsBar.jsx**

Remove the big card/shadow. Make it a clean row:
- White background, `py-14`
- 4 stats in a grid with vertical dividers
- Numbers in Inter bold (`font-sans font-bold text-3xl`), labels in small Inter text
- No icons or very subtle small icons
- Clean, minimal, no card wrapper
- Use `lg:divide-x lg:divide-gray-200` for dividers

```jsx
export default function StatsBar() {
  const stats = [
    { number: '150+', label: 'Projects Completed' },
    { number: '2,000+', label: 'Happy Families' },
    { number: '15+', label: 'Years Experience' },
    { number: '10M+', label: 'Sq Ft Developed' },
  ];

  return (
    <section className="py-14 bg-white">
      <div className="max-w-5xl mx-auto px-4">
        <div className="grid grid-cols-2 lg:grid-cols-4">
          {stats.map((s, i) => (
            <div key={s.label} className="text-center py-4 lg:py-0">
              <div className="font-sans font-bold text-3xl text-[#0c1f33]">{s.number}</div>
              <div className="text-gray-500 text-sm mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- **Step 3: Update HomePage.jsx**

New section order:
```
Hero → LeadStrip → StatsBar → FeaturedCommunities → LatestLaunches → About → Services → FeaturedProjects → Testimonials → Contact
```

Remove imports of CoreValues and Newsletter (they're being deleted/merged).

Update imports to include LeadStrip.

- **Step 4: Delete CoreValues.jsx**

Remove `frontend/src/components/sections/CoreValues.jsx` (Values are now inline in About section).

- **Step 5: Build to verify**

Run: `cd frontend; npm run build`
Expected: Build succeeds, no errors

- **Step 6: Commit**

```bash
git add frontend/src/components/sections/LeadStrip.jsx frontend/src/components/sections/StatsBar.jsx frontend/src/pages/HomePage.jsx
git rm frontend/src/components/sections/CoreValues.jsx
git commit -m "feat: add lead capture strip, simplify stats bar, update section order"
```
