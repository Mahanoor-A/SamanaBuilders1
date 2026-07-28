import React, { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search } from 'lucide-react';

function TableSkeleton({ columns, rows = 5 }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            {columns.map((col, i) => (
              <th key={i} className="px-4 py-3.5 text-left">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, rowIdx) => (
            <tr key={rowIdx} className="border-b border-border/50">
              {columns.map((col, colIdx) => (
                <td key={colIdx} className="px-4 py-3">
                  <div className={`h-4 bg-gray-100 dark:bg-gray-800 rounded animate-pulse ${colIdx === 0 ? 'w-32' : 'w-20'}`} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EmptyState({ message, icon: Icon }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 animate-fade-in">
      {Icon && <Icon className="w-12 h-12 text-text-muted/30 mb-4" />}
      <p className="text-text-muted text-sm">{message || 'No data found'}</p>
    </div>
  );
}

export default function DataTable({
  columns,
  data = [],
  loading = false,
  searchable = true,
  searchPlaceholder = 'Search...',
  pageSize = 10,
  onRowClick,
  emptyMessage,
  emptyIcon,
  className = '',
}) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [page, setPage] = useState(1);

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
    setPage(1);
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter((row) =>
      columns.some((col) => {
        const val = col.accessor ? row[col.accessor] : null;
        return val != null && String(val).toLowerCase().includes(q);
      })
    );
  }, [data, search, columns]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    return [...filtered].sort((a, b) => {
      const va = a[sortKey];
      const vb = b[sortKey];
      if (va == null) return 1;
      if (vb == null) return -1;
      const cmp = typeof va === 'string' ? va.localeCompare(vb) : va - vb;
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paginated = sorted.slice((page - 1) * pageSize, page * pageSize);

  const SortIcon = ({ colKey }) => {
    if (sortKey !== colKey) return <ChevronUp className="w-3.5 h-3.5 text-text-muted/30 ml-1 shrink-0" />;
    return sortDir === 'asc'
      ? <ChevronUp className="w-3.5 h-3.5 text-primary ml-1 shrink-0" />
      : <ChevronDown className="w-3.5 h-3.5 text-primary ml-1 shrink-0" />;
  };

  return (
    <div className={`bg-surface rounded-2xl border border-border shadow-sm animate-fade-in-up ${className}`}>
      {/* Search */}
      {searchable && (
        <div className="p-4 border-b border-border">
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder={searchPlaceholder}
              className="w-full pl-10 pr-4 py-2 bg-bg border border-border rounded-lg text-sm text-text-main placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
        </div>
      )}

      {/* Loading skeleton */}
      {loading ? (
        <TableSkeleton columns={columns} rows={5} />
      ) : paginated.length === 0 ? (
        <EmptyState message={emptyMessage} icon={emptyIcon} />
      ) : (
        <>
          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-bg/50">
                  {columns.map((col, i) => (
                    <th
                      key={i}
                      className={`px-4 py-3.5 text-left text-xs font-semibold text-text-muted uppercase tracking-wider ${
                        col.sortable !== false && col.accessor ? 'cursor-pointer select-none hover:text-text-main transition-colors' : ''
                      }`}
                      onClick={() => col.sortable !== false && col.accessor && handleSort(col.accessor)}
                    >
                      <div className="flex items-center">
                        {col.header}
                        {col.sortable !== false && col.accessor && <SortIcon colKey={col.accessor} />}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {paginated.map((row, rowIdx) => (
                  <tr
                    key={row.id ?? rowIdx}
                    className={`transition-colors ${onRowClick ? 'cursor-pointer hover:bg-primary/5' : 'hover:bg-bg/50'}`}
                    onClick={() => onRowClick?.(row)}
                  >
                    {columns.map((col, colIdx) => (
                      <td key={colIdx} className="px-4 py-3 text-sm text-text-main">
                        {col.cell ? col.cell(row) : row[col.accessor] ?? '-'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-bg/30 rounded-b-2xl">
            <p className="text-xs text-text-muted">
              Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, sorted.length)} of {sorted.length}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(1)}
                disabled={page === 1}
                className="p-1.5 rounded-lg hover:bg-border disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronsLeft className="w-4 h-4 text-text-muted" />
              </button>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg hover:bg-border disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-text-muted" />
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                      page === pageNum
                        ? 'bg-primary text-white'
                        : 'text-text-muted hover:bg-border'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg hover:bg-border disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-text-muted" />
              </button>
              <button
                onClick={() => setPage(totalPages)}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg hover:bg-border disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronsRight className="w-4 h-4 text-text-muted" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}