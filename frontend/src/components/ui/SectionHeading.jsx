export default function SectionHeading({
  title,
  subtitle,
  centered = true,
  light = false,
  className = '',
}) {
  return (
    <div
      className={`${centered ? 'mx-auto text-center' : ''} ${className}`}
    >
      <div
        className={`w-12 h-1 rounded-full mb-6 ${
          centered ? 'mx-auto' : ''
        } ${light ? 'bg-white/30' : 'bg-primary'}`}
      />
      <h2
        className={`font-display text-3xl md:text-4xl font-bold ${
          light ? 'text-white' : 'text-gray-900'
        }`}
      >
        {title}
      </h2>
      {subtitle && (
        <p
          className={`text-lg mt-4 max-w-2xl ${
            centered ? 'mx-auto' : ''
          } ${light ? 'text-white/60' : 'text-gray-500'}`}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}
