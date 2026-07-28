import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Pencil, Trash2, Building2, MapPin, Ruler, Trees, GripHorizontal } from 'lucide-react';
import api from '../../services/api';
import DataTable from '../../components/erp/DataTable';
import PageHeader from '../../components/erp/PageHeader';
import SearchInput from '../../components/erp/SearchInput';
import ConfirmModal from '../../components/erp/ConfirmModal';
import StatusBadge from '../../components/erp/StatusBadge';
import { toast } from '../../utils/toast';

function ProjectsSection({ navigate }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/projects/');
      setProjects(Array.isArray(data) ? data : data.results ?? []);
    } catch { toast.error('Failed to load projects'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await api.delete(`/projects/${deleteTarget.id}/`);
      toast.success('Project deleted');
      setDeleteTarget(null);
      fetch();
    } catch {
      toast.error('Failed to delete project');
    } finally { setDeleting(false); }
  };

  const filtered = projects.filter((p) =>
    !search || (p.name || '').toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    {
      header: 'Project',
      accessor: 'name',
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary-light flex items-center justify-center text-white text-sm font-bold">
            {(row.name || '?')[0]}
          </div>
          <div>
            <p className="font-medium text-text-main">{row.name}</p>
            <p className="text-xs text-text-muted">{row.location || ''}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Location',
      accessor: 'location',
      cell: (row) => (
        <span className="text-sm text-text-muted flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5" /> {row.location || '-'}
        </span>
      ),
    },
    {
      header: 'Plots',
      accessor: 'total_plots',
      cell: (row) => (
        <span className="text-sm font-medium text-text-main">{row.total_plots ?? '-'}</span>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      cell: (row) => <StatusBadge status={row.status || 'active'} />,
    },
    {
      header: '',
      sortable: false,
      cell: (row) => (
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => navigate(`/erp/projects/${row.id}/edit`)}
            className="p-2 rounded-lg hover:bg-primary/10 text-text-muted hover:text-primary transition-colors">
            <Pencil className="w-4 h-4" />
          </button>
          <button onClick={() => setDeleteTarget(row)}
            className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-text-muted hover:text-red-500 transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden animate-fade-in-up">
      <div className="p-5 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Building2 className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-text-main font-display">Projects</h2>
        </div>
        <div className="flex items-center gap-3">
          <SearchInput value={search} onChange={setSearch} placeholder="Search projects..." className="w-56" />
          <button onClick={() => navigate('/erp/projects/new')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-primary-light text-white text-sm font-medium rounded-xl hover:shadow-lg hover:shadow-primary/25 transition-all duration-300">
            <Plus className="w-4 h-4" /> Add Project
          </button>
        </div>
      </div>
      <DataTable
        columns={columns}
        data={filtered}
        loading={loading}
        searchable={false}
        emptyMessage="No projects found"
        emptyIcon={Building2}
        onRowClick={(row) => navigate(`/erp/projects/${row.id}`)}
      />

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Project"
        message={`Are you sure you want to delete ${deleteTarget?.name}?`}
        isLoading={deleting}
      />
    </div>
  );
}

function PlotsSection({ navigate }) {
  const [plots, setPlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const { data } = await api.get('/plots/', { params });
      setPlots(Array.isArray(data) ? data : data.results ?? []);
    } catch { toast.error('Failed to load plots'); }
    finally { setLoading(false); }
  }, [statusFilter]);

  useEffect(() => { fetch(); }, [fetch]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await api.delete(`/plots/${deleteTarget.id}/`);
      toast.success('Plot deleted');
      setDeleteTarget(null);
      fetch();
    } catch {
      toast.error('Failed to delete plot');
    } finally { setDeleting(false); }
  };

  const filtered = plots.filter((p) =>
    !search || (p.plot_no || p.name || '').toLowerCase().includes(search.toLowerCase())
  );

  const statuses = ['', 'available', 'reserved', 'sold', 'blocked'];

  const columns = [
    {
      header: 'Plot No',
      accessor: 'plot_no',
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-white text-sm font-bold">
            <GripHorizontal className="w-4 h-4" />
          </div>
          <div>
            <p className="font-medium text-text-main">{row.plot_no || row.name}</p>
            <p className="text-xs text-text-muted">{row.project_name || row.project || ''}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Size',
      accessor: 'size',
      cell: (row) => (
        <span className="text-sm text-text-muted flex items-center gap-1.5">
          <Ruler className="w-3.5 h-3.5" />
          {row.size ? `${row.size} ${row.size_unit || 'sq. yd'}` : '-'}
        </span>
      ),
    },
    {
      header: 'Price',
      accessor: 'price',
      cell: (row) => (
        <span className="text-sm font-medium text-text-main">
          {row.price ? `PKR ${Number(row.price).toLocaleString()}` : '-'}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      cell: (row) => <StatusBadge status={row.status || 'available'} />,
    },
    {
      header: '',
      sortable: false,
      cell: (row) => (
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => navigate(`/erp/plots/${row.id}/edit`)}
            className="p-2 rounded-lg hover:bg-primary/10 text-text-muted hover:text-primary transition-colors">
            <Pencil className="w-4 h-4" />
          </button>
          <button onClick={() => setDeleteTarget(row)}
            className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-text-muted hover:text-red-500 transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden animate-fade-in-up">
      <div className="p-5 border-b border-border space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Trees className="w-5 h-5 text-emerald-500" />
            <h2 className="text-lg font-semibold text-text-main font-display">Plots</h2>
          </div>
          <div className="flex items-center gap-3">
            <SearchInput value={search} onChange={setSearch} placeholder="Search plots..." className="w-48" />
            <button onClick={() => navigate('/erp/plots/new')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-medium rounded-xl hover:shadow-lg hover:shadow-emerald-500/25 transition-all duration-300">
              <Plus className="w-4 h-4" /> Add Plot
            </button>
          </div>
        </div>
        {/* Status filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {statuses.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === s
                  ? 'bg-primary text-white'
                  : 'bg-bg text-text-muted hover:bg-border'
              }`}
            >
              {s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All'}
            </button>
          ))}
        </div>
      </div>
      <DataTable
        columns={columns}
        data={filtered}
        loading={loading}
        searchable={false}
        emptyMessage="No plots found"
        emptyIcon={Trees}
        onRowClick={(row) => navigate(`/erp/plots/${row.id}`)}
      />

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Plot"
        message={`Are you sure you want to delete plot ${deleteTarget?.plot_no || deleteTarget?.name}?`}
        isLoading={deleting}
      />
    </div>
  );
}

export default function PropertiesPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Properties"
        subtitle="Manage projects and plots"
        breadcrumbs={[{ label: 'ERP' }, { label: 'Properties' }]}
      />
      <ProjectsSection navigate={navigate} />
      <PlotsSection navigate={navigate} />
    </div>
  );
}