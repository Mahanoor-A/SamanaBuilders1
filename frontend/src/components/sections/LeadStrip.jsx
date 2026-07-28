export default function LeadStrip() {
  return (
    <section className="py-10" style={{ background: '#0c1f33' }}>
      <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <h3 className="font-serif text-xl text-white text-center md:text-left">Stay Updated on New Launches</h3>
        <form className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Full Name"
            className="bg-transparent border border-white rounded-lg px-4 py-2 text-sm text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/30"
          />
          <input
            type="email"
            placeholder="Email Address"
            required
            className="bg-transparent border border-white rounded-lg px-4 py-2 text-sm text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/30"
          />
          <button
            type="submit"
            className="bg-gold text-white rounded-lg px-6 py-2 font-semibold text-sm hover:bg-gold/90 transition-colors"
          >
            Subscribe
          </button>
        </form>
      </div>
    </section>
  );
}
