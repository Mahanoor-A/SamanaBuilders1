import React from 'react';

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
      <h2
        className={`font-display text-3xl md:text-4xl font-bold ${
          light ? 'text-white' : 'text-text-main'
        }`}
      >
        {title}
      </h2>
      {subtitle && (
        <p
          className={`text-lg mt-4 max-w-2xl ${
            centered ? 'mx-auto' : ''
          } ${light ? 'text-white/80' : 'text-text-muted'}`}
        >
          {subtitle}
        </p>
      )}
      <div
        className={`bg-gradient-to-r from-primary to-primary-light h-1 w-16 rounded-full mt-4 ${
          centered ? 'mx-auto' : ''
        }`}
      />
    </div>
  );
}
