import { MapPin, Phone, Mail } from 'lucide-react';

const contactInfo = [
  { icon: Phone, text: '0800-12345' },
  { icon: Mail, text: 'info@samanabuilders.com' },
  { icon: MapPin, text: '42-B, Main Boulevard, Gulberg, Lahore, Pakistan' },
];

export default function Contact() {
  return (
    <section id="contact" className="py-16 bg-[#0c1f33]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-12">
          {/* Left — Get in Touch */}
          <div>
            <h2 className="font-serif text-3xl font-semibold text-white mb-4">Get in Touch</h2>
            <p className="text-white/60 mb-8">Have questions or ready to find your dream property? We'd love to hear from you.</p>
            <ul className="space-y-4">
              {contactInfo.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-gold" />
                  </div>
                  <span className="text-white/80 text-sm">{text}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right — Newsletter */}
          <div>
            <h2 className="font-serif text-3xl font-semibold text-white mb-4">Join Our Mailing List</h2>
            <p className="text-white/60 mb-8">Stay updated with our latest projects, offers, and real estate insights.</p>
            <form className="flex flex-col sm:flex-row gap-3" onSubmit={(e) => { e.preventDefault(); }}>
              <input
                type="email"
                placeholder="Your email address"
                required
                className="flex-1 px-4 py-3 rounded-lg bg-transparent border border-white/30 text-white placeholder-white/50 outline-none focus:border-gold transition-colors text-sm"
              />
              <button
                type="submit"
                className="px-6 py-3 rounded-lg bg-gold text-white font-semibold text-sm hover:bg-gold/90 transition-colors whitespace-nowrap"
              >
                Subscribe
              </button>
            </form>
            <p className="text-white/30 text-xs mt-3">No spam. Unsubscribe anytime.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
