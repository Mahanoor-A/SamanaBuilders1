import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export default function Hero() {
  const [form, setForm] = useState({ name: '', email: '', phone: '' });

  const scrollTo = (id) => {
    document.querySelector(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setForm({ name: '', email: '', phone: '' });
  };

  return (
    <section
      id="home"
      className="relative min-h-screen flex items-center overflow-hidden"
    >
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1920&q=80"
          alt="Luxury villa by Samana Builders"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0c1f33] via-[#0c1f33]/60 to-transparent" />
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
        <div className="grid lg:grid-cols-5 gap-12 items-center">
          <div className="lg:col-span-3 text-left">
            <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-gold text-white text-xs font-semibold mb-6">
              Now Accepting Bookings
            </div>
            <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
              Building Dreams,
              <br />
              <span className="italic text-gold">Delivering Trust</span>
            </h1>
            <p className="text-white/60 text-lg md:text-xl max-w-xl leading-relaxed mb-8">
              Samana Builders — premium real estate in Pakistan since 2011
            </p>
            <button
              onClick={() => scrollTo('#projects')}
              className="bg-[#0c1f33] text-white px-8 py-4 rounded-full font-semibold text-base transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(201,168,76,0.4)]"
            >
              Explore Properties
            </button>
          </div>

          <div className="hidden lg:block lg:col-span-2">
            <div
              className="p-8 rounded-2xl"
              style={{
                background: 'rgba(12, 31, 51, 0.85)',
                border: '1px solid rgba(201, 168, 76, 0.3)',
              }}
            >
              <h3 className="font-serif text-2xl font-semibold text-white mb-1">
                Register Your Interest
              </h3>
              <p className="text-white/60 text-sm mb-6">
                Get exclusive updates on our latest projects and offers.
              </p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  type="text"
                  placeholder="Full Name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-transparent border border-white/30 text-white placeholder-white/60 outline-none focus:border-white/60 transition-all duration-300 text-sm"
                />
                <input
                  type="email"
                  placeholder="Email Address"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-transparent border border-white/30 text-white placeholder-white/60 outline-none focus:border-white/60 transition-all duration-300 text-sm"
                />
                <input
                  type="tel"
                  placeholder="Phone Number"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-transparent border border-white/30 text-white placeholder-white/60 outline-none focus:border-white/60 transition-all duration-300 text-sm"
                />
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg bg-gold"
                >
                  Submit Enquiry
                </button>
                <p className="text-white/30 text-xs text-center">
                  We respect your privacy. No spam, unsubscribe anytime.
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={() => scrollTo('#communities')}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/50 hover:text-white transition-colors animate-bounce cursor-pointer z-10"
      >
        <ChevronDown className="w-8 h-8" />
      </button>
    </section>
  );
}
