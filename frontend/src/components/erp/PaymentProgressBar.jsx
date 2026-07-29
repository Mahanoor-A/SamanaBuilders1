import React from 'react';

export default function PaymentProgressBar({ percent = 0, showLabel = true, size = 'md' }) {
  const heights = { sm: 'h-1.5', md: 'h-2.5', lg: 'h-4' };
  const color = percent >= 80 ? 'from-emerald-500 to-emerald-600' :
    percent >= 50 ? 'from-amber-500 to-amber-600' : 'from-primary to-primary-light';
  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-sm font-medium text-text-main">Payment Progress</span>
          <span className="text-sm font-bold text-text-main">{percent}%</span>
        </div>
      )}
      <div className={`w-full ${heights[size]} rounded-full bg-primary/5 overflow-hidden`}>
        <div className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-700 ease-out`}
          style={{ width: `${Math.min(100, Math.max(0, percent))}%` }} />
      </div>
    </div>
  );
}
