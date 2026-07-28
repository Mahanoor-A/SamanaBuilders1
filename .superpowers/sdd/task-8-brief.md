### Task 8: Featured Projects + Testimonials

**Files:**
- Modify: `frontend/src/components/sections/FeaturedProjects.jsx`
- Modify: `frontend/src/components/sections/Testimonials.jsx`

- **Step 1: Tweak FeaturedProjects.jsx**

- Section title: "Our Developments" in Playfair Display centered
- Section bg: white, padding `py-16`
- Keep overlay card design but:
  - Gold badge instead of glassmorphism — `bg-gold text-white px-3 py-1 rounded-full text-xs font-semibold`
  - Project name in Playfair Display (`font-serif text-2xl font-semibold`)
  - Remove backdrop-blur from overlay elements
  - Remove glassmorphism from "Explore" button — use solid white bg with navy text (`bg-white text-[#0c1f33]`)
- Keep image hover scale effect and gradient overlay

Read the current FeaturedProjects.jsx first to understand existing structure.

- **Step 2: Rewrite Testimonials.jsx**

Single testimonial centered (carousel-style):
- Background: `bg-gray-50`, padding `py-16`
- Section title in Playfair Display: "What Our Clients Say" centered
- Show one testimonial at a time with state management
- Quote in Playfair Display italic: `font-serif italic text-2xl text-gray-700`
- Name + location below in Inter: `font-semibold text-[#0c1f33]` + `text-gray-500 text-sm`
- Dot navigation: small circles below active state `bg-gold`, inactive `bg-gray-300`
- No star ratings
- No glassmorphism, no cards

```jsx
import { useState, useEffect } from 'react';

const testimonials = [
  { quote: 'Samana Builders delivered our dream home on time and beyond expectations. The quality of construction is outstanding.', name: 'Ahmed Khan', location: 'Lahore' },
  { quote: 'Professional team, transparent pricing, and excellent after-sales support. Highly recommended.', name: 'Fatima Ali', location: 'Islamabad' },
  { quote: 'From booking to possession, the entire process was smooth and well-managed. They truly care about their customers.', name: 'Muhammad Hassan', location: 'Karachi' },
  { quote: 'Invested in their commercial project and the returns have been exceptional. A trusted partner.', name: 'Sara Ahmed', location: 'Rawalpindi' },
];

export default function Testimonials() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setActive((prev) => (prev + 1) % testimonials.length), 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 text-center">
        <h2 className="font-serif text-3xl font-semibold text-[#0c1f33] mb-10">What Our Clients Say</h2>
        <div className="min-h-[200px] flex flex-col justify-center">
          <p className="font-serif italic text-2xl text-gray-700 mb-8 leading-relaxed">
            &ldquo;{testimonials[active].quote}&rdquo;
          </p>
          <div>
            <p className="font-semibold text-[#0c1f33]">{testimonials[active].name}</p>
            <p className="text-gray-500 text-sm">{testimonials[active].location}</p>
          </div>
        </div>
        <div className="flex justify-center gap-2 mt-8">
          {testimonials.map((_, i) => (
            <button key={i} onClick={() => setActive(i)} className={`w-2.5 h-2.5 rounded-full transition-colors ${i === active ? 'bg-gold' : 'bg-gray-300'}`} aria-label={`Testimonial ${i + 1}`} />
          ))}
        </div>
      </div>
    </section>
  );
}
```

- **Step 3: Build to verify**

Run: `cd frontend; npm run build`
Expected: Build succeeds

- **Step 4: Commit**

```bash
git add frontend/src/components/sections/FeaturedProjects.jsx frontend/src/components/sections/Testimonials.jsx
git commit -m "feat: update projects and testimonials — gold badges, editorial testimonials"
```
