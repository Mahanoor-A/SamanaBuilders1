import React from 'react';

const variantStyles = {
  default: 'bg-surface rounded-2xl border border-border shadow-sm',
  glass: 'bg-white/10 backdrop-blur-md border border-white/20',
  elevated:
    'bg-surface rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300',
  gradient:
    'bg-gradient-to-br from-primary to-primary-light text-white rounded-2xl',
};

export default function Card({
  children,
  className = '',
  variant = 'default',
  hover = false,
  onClick,
}) {
  const hoverStyles = hover
    ? 'hover:-translate-y-2 hover:shadow-xl transition-all duration-300 cursor-pointer'
    : '';

  return (
    <div
      className={`overflow-hidden ${variantStyles[variant]} ${hoverStyles} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
