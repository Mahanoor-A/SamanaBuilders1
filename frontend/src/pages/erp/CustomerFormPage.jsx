import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, FileText } from 'lucide-react';
import api from '../../services/api';
import { customerService } from '../../services/api';
import PageHeader from '../../components/erp/PageHeader';
import FileUpload from '../../components/erp/FileUpload';
import ImageUpload from '../../components/erp/ImageUpload';
import { toast } from '../../utils/toast';

const emptyForm = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  alternate_phone: '',
  cnic: '',
  address: '',
  city: '',
  notes: '',
  is_active: true,
};

export default function CustomerFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [documentFile, setDocumentFile] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [existingDocument, setExistingDocument] = useState(null);
  const [existingImage, setExistingImage] = useState(null);

  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      try {
        setFetching(true);
        const { data } = await api.get(`/customers/${id}/`);
        setForm({
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          email: data.email || '',
          phone: data.phone || '',
          alternate_phone: data.alternate_phone || '',
          cnic: data.cnic || '',
          address: data.address || '',
          city: data.city || '',
          notes: data.notes || '',
          is_active: data.is_active !== false,
        });
        if (data.document) setExistingDocument(data.document);
        if (data.image) setExistingImage(data.image);
      } catch (err) {
        toast.error('Failed to load customer');
        navigate('/erp/customers');
      } finally {
        setFetching(false);
      }
    })();
  }, [id, isEdit, navigate]);

  const validate = () => {
    const errs = {};
    if (!form.first_name.trim()) errs.first_name = 'First name is required';
    if (!form.last_name.trim()) errs.last_name = 'Last name is required';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Invalid email';
    if (!form.phone.trim()) errs.phone = 'Phone is required';
    if (form.cnic && !/^\d{5}-\d{7}-\d{1}$/.test(form.cnic)) errs.cnic = 'CNIC format: XXXXX-XXXXXXX-X';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      setLoading(true);

      const hasFiles = documentFile || imageFile;
      
      if (hasFiles) {
        const formData = new FormData();
        Object.entries(form).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
            formData.append(key, value);
          }
        });
        if (documentFile) formData.append('document', documentFile);
        if (imageFile) formData.append('image', imageFile);

        if (isEdit) {
          await customerService.update(id, formData);
          toast.success('Customer updated');
        } else {
          await customerService.create(formData);
          toast.success('Customer created');
        }
      } else {
        if (isEdit) {
          await api.put(`/customers/${id}/`, form);
          toast.success('Customer updated');
        } else {
          await api.post('/customers/', form);
          toast.success('Customer created');
        }
      }
      navigate('/erp/customers');
    } catch (err) {
      const detail = err.response?.data;
      if (typeof detail === 'object' && detail !== null) {
        const fieldErrors = {};
        Object.entries(detail).forEach(([key, msgs]) => {
          fieldErrors[key] = Array.isArray(msgs) ? msgs.join(', ') : msgs;
        });
        setErrors(fieldErrors);
      }
      toast.error(err.response?.data?.detail || `Failed to ${isEdit ? 'update' : 'create'} customer`);
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

  const inputClass = (name) =>
    `w-full h-11 px-4 bg-bg border rounded-xl text-sm text-text-main placeholder:text-text-muted/50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 ${
      errors[name]
        ? 'border-red-400 focus:ring-red-100 focus:border-red-400'
        : 'border-border focus:border-primary'
    }`;

  return (
    <div>
      <PageHeader
        title={isEdit ? 'Edit Customer' : 'New Customer'}
        breadcrumbs={[
          { label: 'ERP', to: '/erp' },
          { label: 'Customers', to: '/erp/customers' },
          { label: isEdit ? 'Edit' : 'New' },
        ]}
      />

      <div className="max-w-4xl mx-auto animate-fade-in-up">
        <div className="bg-surface rounded-2xl border border-border shadow-sm">
          <div className="p-6 border-b border-border flex items-center gap-3">
            <button
              onClick={() => navigate('/erp/customers')}
              className="p-2 rounded-lg hover:bg-border transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-text-muted" />
            </button>
            <div>
              <h2 className="text-lg font-semibold text-text-main font-display">
                {isEdit ? 'Edit Customer' : 'Create Customer'}
              </h2>
              <p className="text-sm text-text-muted">Fill in the details below</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-main mb-1.5">
                  First Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="first_name"
                  value={form.first_name}
                  onChange={handleChange}
                  placeholder="Enter first name"
                  className={inputClass('first_name')}
                />
                {errors.first_name && <p className="text-xs text-red-500 mt-1">{errors.first_name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-text-main mb-1.5">
                  Last Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="last_name"
                  value={form.last_name}
                  onChange={handleChange}
                  placeholder="Enter last name"
                  className={inputClass('last_name')}
                />
                {errors.last_name && <p className="text-xs text-red-500 mt-1">{errors.last_name}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-main mb-1.5">Email</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Enter email address"
                  className={inputClass('email')}
                />
                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-text-main mb-1.5">
                  Phone <span className="text-red-400">*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="Enter phone number"
                  className={inputClass('phone')}
                />
                {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-main mb-1.5">Alternate Phone</label>
                <input
                  type="tel"
                  name="alternate_phone"
                  value={form.alternate_phone}
                  onChange={handleChange}
                  placeholder="Enter alternate phone"
                  className={inputClass('alternate_phone')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-main mb-1.5">CNIC</label>
                <input
                  type="text"
                  name="cnic"
                  value={form.cnic}
                  onChange={handleChange}
                  placeholder="XXXXX-XXXXXXX-X"
                  className={inputClass('cnic')}
                />
                {errors.cnic && <p className="text-xs text-red-500 mt-1">{errors.cnic}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-main mb-1.5">Address</label>
              <input
                type="text"
                name="address"
                value={form.address}
                onChange={handleChange}
                placeholder="Enter full address"
                className={inputClass('address')}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-main mb-1.5">City</label>
                <input
                  type="text"
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  placeholder="Enter city"
                  className={inputClass('city')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-main mb-1.5">Notes</label>
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  placeholder="Additional notes..."
                  rows={3}
                  className={`${inputClass('notes')} resize-none py-2.5`}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-main mb-1.5">Document</label>
                <FileUpload
                  file={documentFile}
                  onChange={setDocumentFile}
                />
                {isEdit && existingDocument && !documentFile && (
                  <p className="text-xs text-text-muted mt-2 flex items-center gap-1">
                    <FileText className="w-3 h-3" /> Current: {existingDocument.split('/').pop()}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-text-main mb-1.5">Customer Image</label>
                <ImageUpload
                  file={imageFile}
                  preview={existingImage}
                  onChange={setImageFile}
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2 border-t border-border">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={form.is_active}
                  onChange={handleChange}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20"
                />
                <span className="text-sm font-medium text-text-main">Active Customer</span>
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => navigate('/erp/customers')}
                  className="px-5 py-2.5 text-sm font-medium text-text-main bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-primary to-primary-light rounded-xl hover:shadow-lg hover:shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {isEdit ? 'Update Customer' : 'Create Customer'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
