const stats = [
  { number: '150+', label: 'Projects Completed' },
  { number: '2,000+', label: 'Happy Families' },
  { number: '15+', label: 'Years Experience' },
  { number: '10M+', label: 'Sq Ft Developed' },
];

export default function StatsBar() {
  return (
    <section className="py-14 bg-white">
      <div className="max-w-5xl mx-auto px-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 lg:divide-x lg:divide-gray-200">
          {stats.map((s) => (
            <div key={s.label} className="text-center py-4 lg:py-0">
              <div className="font-sans font-bold text-3xl text-[#0c1f33]">{s.number}</div>
              <div className="text-gray-500 text-sm mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
