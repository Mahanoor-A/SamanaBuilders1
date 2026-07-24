import React from 'react';

const variantStyles = {
  primary:
    'bg-[var(--gradient-primary)] text-white hover:shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5',
  secondary:
    'bg-surface text-text-main border border-border hover:bg-primary/5 hover:border-primary/30',
  outline:
    'border-2 border-primary text-primary hover:bg-primary hover:text-white',
  ghost:
    'bg-transparent text-text-main hover:bg-primary/10',
  whatsapp:
    'bg-green-500 text-white hover:bg-green-600 hover:shadow-lg hover:shadow-green-500/25',
};

const sizeStyles = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-base',
  lg: 'px-8 py-4 text-lg',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  icon,
  ...props
}) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-300 ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {icon && <span className="inline-flex shrink-0">{icon}</span>}
      {children}
    </button>
  );
}
