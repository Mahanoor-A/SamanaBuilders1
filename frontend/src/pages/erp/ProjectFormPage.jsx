import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, Building2, MapPin } from 'lucide-react';
import api from '../../services/api';
import PageHeader from '../../components/erp/PageHeader';
import { toast } from '../../utils/toast';

const emptyForm = {
  name: '',
  location: '',
  description: '',
  total_plots: '',
  status: 'active',
};

export default function ProjectFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);

  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      try {
        setFetching(true);
        const { data } = await api.get(`/projects/${id}/`);
        setForm({
          name: data.name || '',
          location: data.location || '',
          description: data.description || '',
          total_plots: data.total_plots ?? '',
          status: data.status || 'active',
        });
      } catch {
        toast.error('Failed to load project');
        navigate('/erp/properties');
      } finally {
        setFetching(false);
      }
    })();
  }, [id, isEdit, navigate]);

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      setLoading(true);
      const payload = { ...form, total_plots: form.total_plots ? Number(form.total_plots) : undefined };
      if (isEdit) {
        await api.put(`/projects/${id}/`, payload);
        toast.success('Project updated');
      } else {
        await api.post('/projects/', payload);
        toast.success('Project created');
      }
      navigate('/erp/properties');
    } catch (err) {
      const detail = err.response?.data;
      if (typeof detail === 'object' && detail) {
        const fieldErrors = {};
        Object.entries(detail).forEach(([key, msgs]) => {
          fieldErrors[key] = Array.isArray(msgs) ? msgs.join(', ') : msgs;
        });
        setErrors(fieldErrors);
      }
      toast.error(`Failed to ${isEdit ? 'update' : 'create'} project`);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={isEdit ? 'Edit Project' : 'New Project'}
        breadcrumbs={[
          { label: 'ERP', to: '/erp' },
          { label: 'Properties', to: '/erp/properties' },
          { label: isEdit ? 'Edit' : 'New' },
        ]}
      />

      <div className="max-w-2xl mx-auto animate-fade-in-up">
        <div className="bg-surface rounded-2xl border border-border shadow-sm">
          <div className="p-6 border-b border-border flex items-center gap-3">
            <button onClick={() => navigate('/erp/properties')}
              className="p-2 rounded-lg hover:bg-border transition-colors">
              <ArrowLeft className="w-5 h-5 text-text-muted" />
            </button>
            <div>
              <h2 className="text-lg font-semibold text-text-main font-display">
                {isEdit ? 'Edit Project' : 'Create Project'}
              </h2>
              <p className="text-sm text-text-muted">Fill in the project details</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <div className="relative">
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder=" "
                    className={`peer w-full px-4 pt-6 pb-2 bg-bg border rounded-xl text-sm text-text-main placeholder-transparent focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 ${
                      errors.name ? 'border-red-400 focus:ring-red-20 focus:border-red-400' : 'border-border focus:border-primary'
                    }`}
                  />
                  <label className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-text-muted/70 peer-focus:top-2 peer-focus:text-xs peer-focus:text-primary peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-text-muted transition-all duration-200 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5" /> Project Name <span className="text-red-400">*</span>
                  </label>
                </div>
                {errors.name && <p className="text-xs text-red-500 mt-1.5 ml-1">{errors.name}</p>}
              </div>

              <div>
                <div className="relative">
                  <input
                    type="text"
                    name="location"
                    value={form.location}
                    onChange={handleChange}
                    placeholder=" "
                    className="peer w-full px-4 pt-6 pb-2 bg-bg border border-border rounded-xl text-sm text-text-main placeholder-transparent focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
                  />
                  <label className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-text-muted/70 peer-focus:top-2 peer-focus:text-xs peer-focus:text-primary peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-text-muted transition-all duration-200 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" /> Location
                  </label>
                </div>
              </div>

              <div>
                <div className="relative">
                  <input
                    type="number"
                    name="total_plots"
                    value={form.total_plots}
                    onChange={handleChange}
                    placeholder=" "
                    min="0"
                    className="peer w-full px-4 pt-6 pb-2 bg-bg border border-border rounded-xl text-sm text-text-main placeholder-transparent focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
                  />
                  <label className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-text-muted/70 peer-focus:top-2 peer-focus:text-xs peer-focus:text-primary peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-text-muted transition-all duration-200">
                    Total Plots
                  </label>
                </div>
              </div>

              <div className="md:col-span-2">
                <div className="relative">
                  <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                    className="w-full px-4 pt-6 pb-2 bg-bg border border-border rounded-xl text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 appearance-none"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="completed">Completed</option>
                  </select>
                  <label className="absolute left-4 top-2 text-xs text-primary">
                    Status
                  </label>
                </div>
              </div>

              <div className="md:col-span-2">
                <div className="relative">
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    placeholder=" "
                    rows={3}
                    className="peer w-full px-4 pt-6 pb-2 bg-bg border border-border rounded-xl text-sm text-text-main placeholder-transparent focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 resize-none"
                  />
                  <label className="absolute left-4 top-4 text-sm text-text-muted/70 peer-focus:top-2 peer-focus:text-xs peer-focus:text-primary peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-text-muted transition-all duration-200">
                    Description
                  </label>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button type="button" onClick={() => navigate('/erp/properties')}
                className="px-5 py-2.5 text-sm font-medium text-text-main bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={loading}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-primary to-primary-light rounded-xl hover:shadow-lg hover:shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {isEdit ? 'Update Project' : 'Create Project'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}