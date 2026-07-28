import React from 'react';

export default function StatCard({ title, value, icon: Icon, trend, color = 'primary', className = '' }) {
  const colorMap = {
    primary: 'from-primary to-primary-light',
    emerald: 'from-emerald-500 to-emerald-600',
    amber: 'from-amber-500 to-amber-600',
    rose: 'from-rose-500 to-rose-600',
    violet: 'from-violet-500 to-violet-600',
    sky: 'from-sky-500 to-sky-600',
  };

  return (
    <div className={`bg-surface rounded-2xl border border-border p-6 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 animate-fade-in-up ${className}`}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm text-text-muted font-medium">{title}</p>
          <p className="text-3xl font-bold text-text-main font-display">{value}</p>
          {trend !== undefined && (
            <p className={`text-xs font-medium flex items-center gap-1 ${trend >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
              <span>{trend >= 0 ? '↑' : '↓'}</span>
              {Math.abs(trend)}% from last month
            </p>
          )}
        </div>
        {icon && (
          <div className={`p-3 rounded-xl bg-gradient-to-br ${colorMap[color] || colorMap.primary} shadow-lg`}>
            <icon className="w-6 h-6 text-white" />
          </div>
        )}
      </div>
    </div>
  );
}