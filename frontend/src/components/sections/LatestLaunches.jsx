import { useEffect, useRef } from 'react';

const launches = [
  {
    id: 'park-grand',
    image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80',
    name: 'Park Grand',
    tagline: 'A Quiet Certainty, For the Few',
    community: 'Samana Green Valley',
  },
  {
    id: 'sky-residences',
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80',
    name: 'Sky Residences',
    tagline: 'Elevated Living. Lahore Address.',
    community: 'Samana Oceanfront',
  },
  {
    id: 'panorama',
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80',
    name: 'Panorama',
    tagline: 'Scenic Lifestyle. Islamabad Address.',
    community: 'Samana Green Valley',
  },
  {
    id: 'gold-city',
    image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80',
    name: 'Samana Gold City',
    tagline: 'A Landmark Destination',
    community: 'Lahore',
  },
];

export default function LatestLaunches() {
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) entry.target.classList.add('visible');
      },
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="launches" className="py-16" ref={sectionRef}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="animate-on-scroll visible text-center mb-12">
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-text-main">
            Latest Launches
          </h2>
        </div>

        {launches.map((item, i) => (
          <div
            key={item.id}
            className={`flex flex-col md:flex-row ${i % 2 === 0 ? 'bg-surface' : 'bg-bg'}`}
          >
            <div className="md:w-2/5">
              <img
                src={item.image}
                alt={item.name}
                className="w-full h-64 md:h-full object-cover"
                loading="lazy"
              />
            </div>
            <div className="md:w-3/5 p-8 md:p-12 flex flex-col justify-center">
              <p className="text-xs uppercase tracking-widest text-text-muted mb-2">
                {item.community}
              </p>
              <h3 className="font-serif text-2xl md:text-3xl font-semibold text-text-main mb-2">
                {item.name}
              </h3>
              <p className="font-serif italic text-text-muted text-lg mb-6">
                {item.tagline}
              </p>
              <a
                href="#"
                className="text-gold font-semibold text-sm hover:underline inline-flex items-center gap-1"
              >
                Learn More <span aria-hidden="true">→</span>
              </a>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
