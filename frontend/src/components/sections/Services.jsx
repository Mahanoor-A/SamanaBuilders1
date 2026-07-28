import { Building2, Store, ShieldCheck, Handshake, Paintbrush, Headphones } from 'lucide-react';

const services = [
  { icon: Building2, title: 'Residential Development', desc: 'Premium homes and villas in prime locations across Pakistan' },
  { icon: Store, title: 'Commercial Projects', desc: 'Modern retail and office spaces for thriving businesses' },
  { icon: ShieldCheck, title: 'Property Management', desc: 'End-to-end management for your real estate investments' },
  { icon: Handshake, title: 'Real Estate Advisory', desc: 'Expert guidance on property investment and development' },
  { icon: Paintbrush, title: 'Interior Design', desc: 'Award-winning design solutions for modern living' },
  { icon: Headphones, title: 'After-Sales Support', desc: 'Dedicated support long after your purchase is complete' },
];

export default function Services() {
  return (
    <section id="services" className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="font-serif text-3xl md:text-4xl font-semibold text-center text-primary mb-12">
          Our Services
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service) => {
            const Icon = service.icon;
            return (
              <div key={service.title}>
                <Icon className="w-12 h-12 mx-auto text-gold mb-4" />
                <h3 className="font-sans font-semibold text-lg text-primary text-center mb-2">
                  {service.title}
                </h3>
                <p className="font-sans text-text-muted text-center leading-relaxed">
                  {service.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
