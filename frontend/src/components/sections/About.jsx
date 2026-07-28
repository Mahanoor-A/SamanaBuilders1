import { Shield, Users, Lightbulb } from 'lucide-react';

const values = [
  { icon: Shield, label: 'Integrity', desc: 'Ethics and transparency in every deal' },
  { icon: Users, label: 'Reliability', desc: 'Trusted by 2,000+ families' },
  { icon: Lightbulb, label: 'Innovation', desc: 'Modern design meets timeless quality' },
];

export default function About() {
  return (
    <section id="about" className="bg-white">
      <div className="grid md:grid-cols-2 min-h-[600px]">
        <div className="overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80"
            alt="Luxury interior by Samana Builders"
            className="h-full w-full object-cover"
          />
        </div>
        <div className="p-12 md:p-16 flex flex-col justify-center">
          <span className="text-gold text-sm font-semibold tracking-[0.2em] uppercase">
            Our Story
          </span>
          <h2 className="font-serif text-4xl md:text-5xl leading-tight font-medium text-[#0c1f33] mt-4 mb-6">
            Crafting Pakistan&apos;s finest living spaces
          </h2>
          <div className="space-y-4 mb-10">
            <p className="text-gray-500 leading-relaxed">
              Since 2011, Samana Builders &amp; Developers has been at the forefront of Pakistan&apos;s real estate transformation. What began as a vision to create spaces where families thrive has grown into one of the country&apos;s most trusted development groups.
            </p>
            <p className="text-gray-500 leading-relaxed">
              Over the years, we&apos;ve proudly delivered quality homes and commercial spaces to more than 2,000 families. Our commitment to quality construction, transparent dealings, and customer satisfaction has earned us a reputation built on trust. Today, with over 10 million square feet under development and 150+ completed projects, we continue to set new benchmarks in design, quality, and innovation.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {values.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="border-l-2 border-gold pl-4">
                <Icon className="w-5 h-5 text-gold mb-2" />
                <div className="font-semibold text-[#0c1f33]">{label}</div>
                <div className="text-gray-500 text-sm mt-1">{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
