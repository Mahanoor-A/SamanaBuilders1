import { ArrowRight } from 'lucide-react';

const featuredProjects = [
  {
    id: 'green-valley',
    image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80',
    title: 'Samana Green Valley',
    subtitle: 'Islamabad',
    tagline: 'A premium gated community with luxury villas, lush parks, and world-class amenities',
    badge: 'New Launch',
  },
  {
    id: 'sky-residences',
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80',
    title: 'Samana Sky Residences',
    subtitle: 'Lahore',
    tagline: 'Iconic high-rise living with panoramic city views and modern infrastructure',
    badge: 'Coming Soon',
  },
  {
    id: 'gold-city',
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80',
    title: 'Samana Gold City',
    subtitle: 'Lahore',
    tagline: 'A landmark residential community offering luxury apartments and villas',
    badge: 'Coming Soon',
  },
];

function ProjectCard({ project }) {
  return (
    <div className="group relative min-h-[400px] rounded-3xl overflow-hidden">
      <img
        src={project.image}
        alt={project.title}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      <div className="absolute top-4 left-4 bg-gold text-white px-3 py-1 rounded-full text-xs font-semibold">
        {project.badge}
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-8">
        <p className="text-white/50 text-xs uppercase tracking-widest mb-1">{project.subtitle}</p>
        <h3 className="font-serif text-2xl font-semibold text-white mb-2">
          {project.title}
        </h3>
        <p className="text-white/60 text-sm mb-4 max-w-xs">{project.tagline}</p>
        <button className="inline-flex items-center gap-2 text-sm font-semibold text-white hover:text-white/80 transition-colors group/btn">
          View Details
          <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
        </button>
      </div>
    </div>
  );
}

export default function FeaturedProjects() {
  return (
    <section id="projects" className="py-16 bg-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="font-serif text-3xl md:text-4xl font-semibold text-primary text-center mb-12">
          Our Developments
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featuredProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      </div>
    </section>
  );
}
