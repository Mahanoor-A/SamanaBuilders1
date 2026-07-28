import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, GripHorizontal, Ruler, DollarSign } from 'lucide-react';
import api from '../../services/api';
import PageHeader from '../../components/erp/PageHeader';
import { toast } from '../../utils/toast';

const emptyForm = {
  plot_no: '',
  project: '',
  size: '',
  size_unit: 'sq. yd',
  price: '',
  status: 'available',
  description: '',
};

export default function PlotFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/projects/');
        setProjects(Array.isArray(data) ? data : data.results ?? []);
      } catch { /* ignore */ }
    })();
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      try {
        setFetching(true);
        const { data } = await api.get(`/plots/${id}/`);
        setForm({
          plot_no: data.plot_no || '',
          project: data.project || data.project_id || '',
          size: data.size ?? '',
          size_unit: data.size_unit || 'sq. yd',
          price: data.price ?? '',
          status: data.status || 'available',
          description: data.description || '',
        });
      } catch {
        toast.error('Failed to load plot');
        navigate('/erp/properties');
      } finally {
        setFetching(false);
      }
    })();
  }, [id, isEdit, navigate]);

  const validate = () => {
    const errs = {};
    if (!form.plot_no.trim()) errs.plot_no = 'Plot number is required';
    if (!form.project) errs.project = 'Project is required';
    if (!form.size) errs.size = 'Size is required';
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
      const payload = {
        ...form,
        size: form.size ? Number(form.size) : undefined,
        price: form.price ? Number(form.price) : undefined,
      };
      if (isEdit) {
        await api.put(`/plots/${id}/`, payload);
        toast.success('Plot updated');
      } else {
        await api.post('/plots/', payload);
        toast.success('Plot created');
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
      toast.error(`Failed to ${isEdit ? 'update' : 'create'} plot`);
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
        title={isEdit ? 'Edit Plot' : 'New Plot'}
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
                {isEdit ? 'Edit Plot' : 'Create Plot'}
              </h2>
              <p className="text-sm text-text-muted">Fill in the plot details</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Plot No */}
              <div>
                <div className="relative">
                  <input type="text" name="plot_no" value={form.plot_no} onChange={handleChange} placeholder=" "
                    className={`peer w-full px-4 pt-6 pb-2 bg-bg border rounded-xl text-sm text-text-main placeholder-transparent focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 ${
                      errors.plot_no ? 'border-red-400 focus:ring-red-20 focus:border-red-400' : 'border-border focus:border-primary'
                    }`}
                  />
                  <label className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-text-muted/70 peer-focus:top-2 peer-focus:text-xs peer-focus:text-primary peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-text-muted transition-all duration-200 flex items-center gap-1.5">
                    <GripHorizontal className="w-3.5 h-3.5" /> Plot No <span className="text-red-400">*</span>
                  </label>
                </div>
                {errors.plot_no && <p className="text-xs text-red-500 mt-1.5 ml-1">{errors.plot_no}</p>}
              </div>

              {/* Project */}
              <div>
                <div className="relative">
                  <select name="project" value={form.project} onChange={handleChange}
                    className={`w-full px-4 pt-6 pb-2 bg-bg border rounded-xl text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 appearance-none ${
                      errors.project ? 'border-red-400' : 'border-border focus:border-primary'
                    }`}
                  >
                    <option value="">Select project</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  <label className="absolute left-4 top-2 text-xs text-primary flex items-center gap-1.5">
                    Project <span className="text-red-400">*</span>
                  </label>
                </div>
                {errors.project && <p className="text-xs text-red-500 mt-1.5 ml-1">{errors.project}</p>}
              </div>

              {/* Size */}
              <div>
                <div className="relative">
                  <input type="number" name="size" value={form.size} onChange={handleChange} placeholder=" " min="0" step="0.01"
                    className={`peer w-full px-4 pt-6 pb-2 bg-bg border rounded-xl text-sm text-text-main placeholder-transparent focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 ${
                      errors.size ? 'border-red-400 focus:ring-red-20 focus:border-red-400' : 'border-border focus:border-primary'
                    }`}
                  />
                  <label className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-text-muted/70 peer-focus:top-2 peer-focus:text-xs peer-focus:text-primary peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-text-muted transition-all duration-200 flex items-center gap-1.5">
                    <Ruler className="w-3.5 h-3.5" /> Size <span className="text-red-400">*</span>
                  </label>
                </div>
                {errors.size && <p className="text-xs text-red-500 mt-1.5 ml-1">{errors.size}</p>}
              </div>

              {/* Size Unit */}
              <div>
                <div className="relative">
                  <select name="size_unit" value={form.size_unit} onChange={handleChange}
                    className="w-full px-4 pt-6 pb-2 bg-bg border border-border rounded-xl text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 appearance-none"
                  >
                    <option value="sq. yd">Sq. Yards</option>
                    <option value="sq. ft">Sq. Feet</option>
                    <option value="marla">Marla</option>
                    <option value="kanal">Kanal</option>
                    <option value="acre">Acre</option>
                  </select>
                  <label className="absolute left-4 top-2 text-xs text-primary">
                    Size Unit
                  </label>
                </div>
              </div>

              {/* Price */}
              <div>
                <div className="relative">
                  <input type="number" name="price" value={form.price} onChange={handleChange} placeholder=" " min="0"
                    className="peer w-full px-4 pt-6 pb-2 bg-bg border border-border rounded-xl text-sm text-text-main placeholder-transparent focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
                  />
                  <label className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-text-muted/70 peer-focus:top-2 peer-focus:text-xs peer-focus:text-primary peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-text-muted transition-all duration-200 flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5" /> Price (PKR)
                  </label>
                </div>
              </div>

              {/* Status */}
              <div>
                <div className="relative">
                  <select name="status" value={form.status} onChange={handleChange}
                    className="w-full px-4 pt-6 pb-2 bg-bg border border-border rounded-xl text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 appearance-none"
                  >
                    <option value="available">Available</option>
                    <option value="reserved">Reserved</option>
                    <option value="sold">Sold</option>
                    <option value="blocked">Blocked</option>
                  </select>
                  <label className="absolute left-4 top-2 text-xs text-primary">
                    Status
                  </label>
                </div>
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <div className="relative">
                  <textarea name="description" value={form.description} onChange={handleChange} placeholder=" " rows={3}
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
                {isEdit ? 'Update Plot' : 'Create Plot'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}