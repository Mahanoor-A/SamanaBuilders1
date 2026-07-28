# Task 8: Featured Projects + Testimonials — Report

**Status:** ✅ Complete

**Commit:** `bda0dc5`

## Changes

### FeaturedProjects.jsx
- Removed API/proxy error code (`projectService.getAll()`, `useState`, `SectionHeading`, animation/intersection observer)
- Changed section bg from `bg-gray-50` to `bg-white`, padding `py-16`
- Title changed to "Our Developments" in Playfair Display centered
- Badge updated to gold (`bg-gold text-white px-3 py-1 rounded-full text-xs font-semibold`)
- Project title uses `font-serif text-2xl font-semibold text-white`
- Removed `animate-on-scroll`, `visible`, `font-display`, glassmorphism classes

### Testimonials.jsx
- Complete rewrite to single-testimonial centered carousel
- Auto-rotate every 5 seconds via `useEffect` + `setInterval`
- Dot navigation (gold active, gray-300 inactive)
- 4 testimonials (added Sara Ahmed)
- No star ratings, no cards, no shadows, no IntersectionObserver

## Build Verification
- `npm run build` succeeded (1658 modules, 5.3s)

## Concerns
None.

## Report
F:\Mahanoor-A\Mahanoor-A\.superpowers\sdd\task-8-report.md
