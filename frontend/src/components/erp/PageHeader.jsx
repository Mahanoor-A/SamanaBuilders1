import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PageHeader({ title, subtitle, breadcrumbs = [], actions, className = '' }) {
  return (
    <div className={`mb-6 animate-fade-in-up ${className}`}>
      {breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-1.5 text-sm text-text-muted mb-2">
          <Link to="/erp" className="hover:text-primary transition-colors">
            <Home className="w-4 h-4" />
          </Link>
          {breadcrumbs.map((crumb, i) => (
            <React.Fragment key={i}>
              <ChevronRight className="w-3.5 h-3.5 text-text-muted/50" />
              {crumb.to ? (
                <Link to={crumb.to} className="hover:text-primary transition-colors">{crumb.label}</Link>
              ) : (
                <span className="text-text-main font-medium">{crumb.label}</span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-main font-display">{title}</h1>
          {subtitle && <p className="text-text-muted mt-1">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-3 shrink-0">{actions}</div>}
      </div>
    </div>
  );
}