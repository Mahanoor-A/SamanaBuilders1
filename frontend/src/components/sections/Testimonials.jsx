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
    <section id="testimonials" className="py-16 bg-bg">
      <div className="max-w-3xl mx-auto px-4 text-center">
        <h2 className="font-serif text-3xl font-semibold text-primary mb-10">What Our Clients Say</h2>
        <div className="min-h-[200px] flex flex-col justify-center">
          <p className="font-serif italic text-2xl text-text-main mb-8 leading-relaxed">
            &ldquo;{testimonials[active].quote}&rdquo;
          </p>
          <div>
            <p className="font-semibold text-primary">{testimonials[active].name}</p>
            <p className="text-text-muted text-sm">{testimonials[active].location}</p>
          </div>
        </div>
        <div className="flex justify-center gap-2 mt-8">
          {testimonials.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`w-2.5 h-2.5 rounded-full transition-colors ${i === active ? 'bg-gold' : 'bg-gray-300'}`}
              aria-label={`Testimonial ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
