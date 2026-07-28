import React, { useState, useEffect, useCallback } from 'react';
import { History, User, Monitor, Globe, ChevronRight, Loader2 } from 'lucide-react';
import api from '../../services/api';
import PageHeader from '../../components/erp/PageHeader';
import SearchInput from '../../components/erp/SearchInput';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (actionFilter) params.action = actionFilter;
      const { data } = await api.get('/audit-logs/', { params });
      setLogs(Array.isArray(data) ? data : data.results ?? []);
    } catch {
      // silent - audit logs are read-only
    } finally {
      setLoading(false);
    }
  }, [actionFilter]);

  useEffect(() => { fetch(); }, [fetch]);

  const actionColors = {
    create: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500' },
    update: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', dot: 'bg-blue-500' },
    delete: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', dot: 'bg-red-500' },
    login: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-400', dot: 'bg-purple-500' },
    logout: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-600 dark:text-gray-400', dot: 'bg-gray-400' },
    view: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', dot: 'bg-amber-500' },
  };

  const getActionStyle = (action) => actionColors[action] || actionColors.view;

  const filtered = logs.filter((log) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (log.action || '').toLowerCase().includes(q) ||
      (log.model || '').toLowerCase().includes(q) ||
      (log.user_name || log.user?.username || '').toLowerCase().includes(q)
    );
  });

  const actions = ['', 'create', 'update', 'delete', 'login', 'logout', 'view'];

  return (
    <div>
      <PageHeader
        title="Audit Logs"
        subtitle="Track system activity and changes"
        breadcrumbs={[{ label: 'ERP' }, { label: 'Audit Logs' }]}
      />

      {/* Filters */}
      <div className="bg-surface rounded-2xl border border-border shadow-sm mb-6 p-4 animate-fade-in-up">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <SearchInput value={search} onChange={setSearch} placeholder="Search logs..." className="w-full sm:w-72" />
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-text-muted">Action:</span>
            {actions.map((a) => (
              <button
                key={a}
                onClick={() => setActionFilter(a)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  actionFilter === a
                    ? 'bg-primary text-white'
                    : 'bg-bg text-text-muted hover:bg-border'
                }`}
              >
                {a ? a.charAt(0).toUpperCase() + a.slice(1) : 'All'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Logs list */}
      <div className="bg-surface rounded-2xl border border-border shadow-sm animate-fade-in-up">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <History className="w-12 h-12 text-text-muted/30 mb-4" />
            <p className="text-text-muted text-sm">No audit logs found</p>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {filtered.map((log, i) => {
              const actionStyle = getActionStyle(log.action);
              return (
                <div key={log.id || i} className="p-4 hover:bg-bg/50 transition-colors">
                  <div className="flex items-start gap-4">
                    {/* Timeline dot */}
                    <div className="flex flex-col items-center pt-1">
                      <div className={`w-2.5 h-2.5 rounded-full ${actionStyle.dot} ring-4 ring-surface`} />
                      {i < filtered.length - 1 && <div className="w-px h-full bg-border mt-1" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${actionStyle.bg} ${actionStyle.text}`}>
                          {log.action}
                        </span>
                        <span className="text-sm font-medium text-text-main">{log.model || log.model_name}</span>
                        {log.model_id && (
                          <span className="text-xs text-text-muted">#{log.model_id}</span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-text-muted">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {log.user_name || log.user?.username || 'System'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Globe className="w-3 h-3" />
                          {log.ip_address || 'N/A'}
                        </span>
                        <span>{log.created_at ? new Date(log.created_at).toLocaleString() : '-'}</span>
                      </div>

                      {log.details && (
                        <details className="mt-2">
                          <summary className="text-xs text-primary cursor-pointer hover:text-primary-light transition-colors">
                            View details
                          </summary>
                          <pre className="mt-2 p-3 bg-bg rounded-xl text-xs text-text-muted overflow-x-auto max-h-32">
                            {typeof log.details === 'object'
                              ? JSON.stringify(log.details, null, 2)
                              : String(log.details)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}