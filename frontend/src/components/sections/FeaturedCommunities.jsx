import { useEffect, useRef } from 'react';
import { ArrowRight } from 'lucide-react';

const communities = [
  {
    id: 'green-valley',
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80',
    name: 'Samana Green Valley',
    tagline: 'Live the Dream in Islamabad',
    description: 'Luxury Villas & Plots',
    badge: 'New Launch',
  },
  {
    id: 'oceanfront',
    image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&q=80',
    name: 'Samana Oceanfront',
    tagline: 'Resort Lifestyle. Lahore Address.',
    description: 'Luxury Apartments & Penthouses',
    badge: 'Coming Soon',
  },
];

export default function FeaturedCommunities() {
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
    <section id="communities" className="py-16 bg-white" ref={sectionRef}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="animate-on-scroll visible text-center mb-12">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-gray-900">
            Featured Communities
          </h2>
          <p className="text-gray-500 text-lg mt-4 max-w-2xl mx-auto">
            Discover our world-class residential communities crafted for luxurious living
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {communities.map((community) => (
            <div
              key={community.id}
              className="animate-on-scroll visible group relative min-h-[400px] md:min-h-[500px] rounded-3xl overflow-hidden"
              style={{ animationDelay: '0.1s' }}
            >
              <img
                src={community.image}
                alt={community.name}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              <div className="absolute top-5 left-5 px-4 py-1.5 rounded-full text-xs font-semibold bg-gold text-white">
                {community.badge}
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-8 md:p-10">
                <p className="text-white/50 text-sm font-medium uppercase tracking-widest mb-2">
                  {community.description}
                </p>
                <h3 className="font-serif italic text-3xl md:text-4xl text-white mb-2">
                  {community.name}
                </h3>
                <p className="text-white/70 text-lg mb-6">{community.tagline}</p>
                <button className="inline-flex items-center gap-2 px-6 py-3 rounded-full border-2 border-white/30 text-white font-semibold text-sm hover:bg-white/10 transition-all duration-300 group/btn">
                  Learn More
                  <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
