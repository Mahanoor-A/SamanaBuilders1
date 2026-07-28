### Task 5: Featured Communities + Latest Launches

**Files:**
- Modify: `frontend/src/components/sections/FeaturedCommunities.jsx`
- Modify: `frontend/src/components/sections/LatestLaunches.jsx`

- **Step 1: Tweak FeaturedCommunities.jsx**

- Replace glassmorphism badges with solid gold badges (`bg-gold text-white`)
- Community names in Playfair Display italic (`font-serif italic`)
- Tighter padding: `py-16`
- Remove glassmorphism from "Learn More" button — use outlined white style (`border-2 border-white/30 text-white hover:bg-white/10`)
- Remove `backdrop-blur-sm` from badge and button

- **Step 2: Rewrite LatestLaunches.jsx as directory-style**

Replace 4-column cards with horizontal rows:
- Alternating bg: white / warm gray (`bg-white` / `bg-gray-50`)
- Image left (w-2/5 aspect-video object-cover)
- Content right (w-3/5): community name (small uppercase, muted), project name (Playfair Display), tagline (Playfair Display italic), "Learn More" gold link
- 4 items with the same data
- No card styling — just horizontal flex rows with optional subtle border-bottom

```jsx
const launches = [
  { id: 'park-grand', image: '...', name: 'Park Grand', tagline: 'A Quiet Certainty, For the Few', community: 'Samana Green Valley' },
  { id: 'sky-residences', image: '...', name: 'Sky Residences', tagline: 'Elevated Living. Lahore Address.', community: 'Samana Oceanfront' },
  { id: 'panorama', image: '...', name: 'Panorama', tagline: 'Scenic Lifestyle. Islamabad Address.', community: 'Samana Green Valley' },
  { id: 'gold-city', image: '...', name: 'Samana Gold City', tagline: 'A Landmark Destination', community: 'Lahore' },
];

{launches.map((item, i) => (
  <div key={item.id} className={`flex flex-col md:flex-row ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
    <div className="md:w-2/5">
      <img src={item.image} alt={item.name} className="w-full h-64 md:h-full object-cover" loading="lazy" />
    </div>
    <div className="md:w-3/5 p-8 md:p-12 flex flex-col justify-center">
      <p className="text-xs uppercase tracking-widest text-gray-400 mb-2">{item.community}</p>
      <h3 className="font-serif text-2xl md:text-3xl font-semibold text-gray-900 mb-2">{item.name}</h3>
      <p className="font-serif italic text-gray-500 text-lg mb-6">{item.tagline}</p>
      <a href="#" className="text-gold font-semibold text-sm hover:underline inline-flex items-center gap-1">
        Learn More <span aria-hidden="true">→</span>
      </a>
    </div>
  </div>
))}
```

Images (use the same Unsplash URLs as current):
- park-grand: `https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80`
- sky-residences: `https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80`
- panorama: `https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80`
- gold-city: `https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80`

- **Step 3: Build to verify**

Run: `cd frontend; npm run build`
Expected: Build succeeds

- **Step 4: Commit**

```bash
git add frontend/src/components/sections/FeaturedCommunities.jsx frontend/src/components/sections/LatestLaunches.jsx
git commit -m "feat: redesign communities and launches — gold badges, directory-style launches"
```
