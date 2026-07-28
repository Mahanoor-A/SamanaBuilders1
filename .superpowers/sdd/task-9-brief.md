### Task 9: Contact + Newsletter (combined) + Footer tweaks

**Files:**
- Modify: `frontend/src/components/sections/Contact.jsx`
- Modify: `frontend/src/components/layout/Footer.jsx`
- Delete: `frontend/src/components/sections/Newsletter.jsx` (remove from filesystem)

- **Step 1: Rewrite Contact.jsx as combined section**

Navy background section (`bg-[#0c1f33]`), padding `py-16`:
- Two-column layout `grid md:grid-cols-2 gap-12`
- **Left**: "Get in Touch"
  - Heading: Playfair Display, white, "Get in Touch"
  - Text: "Have questions or ready to find your dream property? We'd love to hear from you."
  - Contact details:
    - Phone: 0800-12345
    - Email: info@samanabuilders.com
    - Address: 42-B, Main Boulevard, Gulberg, Lahore, Pakistan
  - Each with icon from lucide-react (Phone, Mail, MapPin), white text
- **Right**: "Newsletter"
  - Heading: Playfair Display, white, "Join Our Mailing List"
  - Text: "Stay updated with our latest projects, offers, and real estate insights."
  - Email field: transparent bg, white border, white text, white placeholder, rounded-lg
  - Subscribe button: gold bg (`bg-gold`), white text, rounded-lg
- Gold accent for section separator

- **Step 2: Minor Footer tweaks**

Read `frontend/src/components/layout/Footer.jsx` first.
- Change logo tagline to use Playfair Display (`font-serif`)
- Ensure any blue links/accents use gold instead where appropriate

- **Step 3: Delete Newsletter.jsx**

Remove `frontend/src/components/sections/Newsletter.jsx` from filesystem.

- **Step 4: Build to verify**

Run: `cd frontend; npm run build`
Expected: Build succeeds

- **Step 5: Commit**

```bash
git add frontend/src/components/sections/Contact.jsx frontend/src/components/layout/Footer.jsx
git rm frontend/src/components/sections/Newsletter.jsx
git commit -m "feat: combine contact+newsletter, update footer for editorial feel"
```
