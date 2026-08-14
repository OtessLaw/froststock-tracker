import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import API from '../services/api';

const UNIT_OPTIONS = ['kg', 'g', 'piece', 'carton', 'bag', 'pack', 'box', 'other'];

const EMPTY_FORM = {
  name: '',
  category: '',
  unit: 'kg',
  buyingPrice: '',
  sellingPrice: '',
  initialStock: '',
  minimumStock: '',
  supplier: '',
  description: '',
  image: '',
};

export default function ProductFormModal({ product, onClose, onSaved }) {
  const isEdit = Boolean(product?._id);

  const [form, setForm] = useState(EMPTY_FORM);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [metaLoading, setMetaLoading] = useState(true);

  // Prefill when editing
  useEffect(() => {
    if (isEdit && product) {
      setForm({
        name: product.name || '',
        category: product.category?._id || product.category || '',
        unit: product.unit || 'kg',
        buyingPrice: product.buyingPrice?.toString() || '',
        sellingPrice: product.sellingPrice?.toString() || '',
        initialStock: '',
        minimumStock: product.minimumStock?.toString() || '',
        supplier: product.supplier?._id || product.supplier || '',
        description: product.description || '',
        image: product.image || '',
      });
    }
  }, [isEdit, product]);

  // Load categories + suppliers
  useEffect(() => {
    let cancelled = false;
    Promise.all([
      API.get('/categories'),
      API.get('/suppliers'),
    ])
      .then(([catRes, supRes]) => {
        if (!cancelled) {
          const catsData = catRes.data?.data || catRes.data?.categories || catRes.data || [];
          const supsData = supRes.data?.data || supRes.data?.suppliers || supRes.data || [];
          setCategories(Array.isArray(catsData) ? catsData : []);
          setSuppliers(Array.isArray(supsData) ? supsData : []);
        }
      })
      .catch((err) => {
        console.error('Failed to load form meta:', err.message);
        if (!cancelled) {
          setCategories([]);
          setSuppliers([]);
        }
      })
      .finally(() => { if (!cancelled) setMetaLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Product name is required.';
    if (!form.category) e.category = 'Please select a category.';
    if (!form.unit) e.unit = 'Please select a unit.';
    if (form.buyingPrice === '' || isNaN(Number(form.buyingPrice)) || Number(form.buyingPrice) < 0)
      e.buyingPrice = 'Enter a valid buying price.';
    if (form.sellingPrice === '' || isNaN(Number(form.sellingPrice)) || Number(form.sellingPrice) < 0)
      e.sellingPrice = 'Enter a valid selling price.';
    if (!isEdit && (form.initialStock === '' || isNaN(Number(form.initialStock)) || Number(form.initialStock) < 0))
      e.initialStock = 'Enter a valid initial stock quantity.';
    if (form.minimumStock !== '' && (isNaN(Number(form.minimumStock)) || Number(form.minimumStock) < 0))
      e.minimumStock = 'Enter a valid minimum stock level.';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        category: form.category,
        unit: form.unit,
        buyingPrice: Number(form.buyingPrice),
        sellingPrice: Number(form.sellingPrice),
        minimumStock: form.minimumStock !== '' ? Number(form.minimumStock) : 0,
        supplier: form.supplier || undefined,
        description: form.description.trim() || undefined,
        image: form.image.trim() || undefined,
      };
      if (!isEdit) {
        payload.initialStock = Number(form.initialStock);
      }

      if (isEdit) {
        await API.put(`/products/${product._id}`, payload);
        toast.success('Product updated successfully!');
      } else {
        await API.post('/products', payload);
        toast.success('Product added successfully!');
      }
      onSaved();
    } catch (err) {
      const msg = err?.response?.data?.message || err?.response?.data?.error || 'Failed to save product.';
      toast.error(msg);
      if (err?.response?.data?.errors) {
        setErrors(err.response.data.errors);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && !saving && onClose()}
    >
      <div className="modal-content">
        {/* Header */}
        <div className="modal-header">
          <h2 className="text-lg font-bold text-slate-800">
            {isEdit ? 'Edit Product' : 'Add New Product'}
          </h2>
          <button
            onClick={() => !saving && onClose()}
            className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            disabled={saving}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="p-5 space-y-4">
            {metaLoading && (
              <div className="flex items-center gap-2 text-sm text-gray-400 py-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading options…
              </div>
            )}

            {/* Name */}
            <div>
              <label className="label">
                Product Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="e.g. Frozen Tilapia"
                className={`input-field ${errors.name ? 'border-red-300 focus:ring-red-400' : ''}`}
                disabled={saving}
              />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
            </div>

            {/* Category + Unit row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">
                  Category <span className="text-red-400">*</span>
                </label>
                <select
                  value={form.category}
                  onChange={(e) => handleChange('category', e.target.value)}
                  className={`input-field ${errors.category ? 'border-red-300' : ''}`}
                  disabled={saving || metaLoading}
                >
                  <option value="">Select…</option>
                  {(Array.isArray(categories) ? categories : []).map((cat) => (
                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                  ))}
                </select>
                {errors.category && <p className="text-xs text-red-500 mt-1">{errors.category}</p>}
              </div>

              <div>
                <label className="label">
                  Unit <span className="text-red-400">*</span>
                </label>
                <select
                  value={form.unit}
                  onChange={(e) => handleChange('unit', e.target.value)}
                  className={`input-field ${errors.unit ? 'border-red-300' : ''}`}
                  disabled={saving}
                >
                  {UNIT_OPTIONS.map((u) => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
                {errors.unit && <p className="text-xs text-red-500 mt-1">{errors.unit}</p>}
              </div>
            </div>

            {/* Buying + Selling Price */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">
                  Buying Price <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-semibold">GH₵</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.buyingPrice}
                    onChange={(e) => handleChange('buyingPrice', e.target.value)}
                    placeholder="0.00"
                    className={`input-field pl-10 ${errors.buyingPrice ? 'border-red-300' : ''}`}
                    disabled={saving}
                  />
                </div>
                {errors.buyingPrice && <p className="text-xs text-red-500 mt-1">{errors.buyingPrice}</p>}
              </div>

              <div>
                <label className="label">
                  Selling Price <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-semibold">GH₵</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.sellingPrice}
                    onChange={(e) => handleChange('sellingPrice', e.target.value)}
                    placeholder="0.00"
                    className={`input-field pl-10 ${errors.sellingPrice ? 'border-red-300' : ''}`}
                    disabled={saving}
                  />
                </div>
                {errors.sellingPrice && <p className="text-xs text-red-500 mt-1">{errors.sellingPrice}</p>}
              </div>
            </div>

            {/* Live margin preview */}
            {form.buyingPrice && form.sellingPrice && Number(form.buyingPrice) > 0 && (
              <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-2 text-sm text-green-700 font-semibold">
                Profit margin:{' '}
                {(((Number(form.sellingPrice) - Number(form.buyingPrice)) / Number(form.buyingPrice)) * 100).toFixed(1)}%
                &nbsp;·&nbsp; Profit: GH₵{(Number(form.sellingPrice) - Number(form.buyingPrice)).toFixed(2)}
              </div>
            )}

            {/* Initial Stock (new only) + Minimum Stock */}
            <div className="grid grid-cols-2 gap-3">
              {!isEdit && (
                <div>
                  <label className="label">
                    Initial Stock <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.initialStock}
                    onChange={(e) => handleChange('initialStock', e.target.value)}
                    placeholder="0"
                    className={`input-field ${errors.initialStock ? 'border-red-300' : ''}`}
                    disabled={saving}
                  />
                  {errors.initialStock && <p className="text-xs text-red-500 mt-1">{errors.initialStock}</p>}
                </div>
              )}

              <div className={isEdit ? 'col-span-2' : ''}>
                <label className="label">Minimum Stock Level</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.minimumStock}
                  onChange={(e) => handleChange('minimumStock', e.target.value)}
                  placeholder="0"
                  className={`input-field ${errors.minimumStock ? 'border-red-300' : ''}`}
                  disabled={saving}
                />
                {errors.minimumStock && <p className="text-xs text-red-500 mt-1">{errors.minimumStock}</p>}
              </div>
            </div>

            {/* Supplier */}
            <div>
              <label className="label">Supplier</label>
              <select
                value={form.supplier}
                onChange={(e) => handleChange('supplier', e.target.value)}
                className="input-field"
                disabled={saving || metaLoading}
              >
                <option value="">None / Unknown</option>
                {(Array.isArray(suppliers) ? suppliers : []).map((sup) => (
                  <option key={sup._id} value={sup._id}>{sup.name}</option>
                ))}
              </select>
            </div>

            {/* Product Image URL */}
            <div>
              <label className="label">
                Product Image URL <span className="text-gray-400 font-normal">(optional photo link)</span>
              </label>
              <input
                type="url"
                value={form.image}
                onChange={(e) => handleChange('image', e.target.value)}
                placeholder="https://images.unsplash.com/... or paste image link"
                className="input-field"
                disabled={saving}
              />
              <p className="text-[11px] text-gray-400 mt-1">
                Leave empty to automatically display a high-definition photo for this product type (Sausage, Tilapia, Red Fish, Kpanla, Chicken, etc.).
              </p>
            </div>

            {/* Description */}
            <div>
              <label className="label">Description <span className="text-gray-400 font-normal">(optional)</span></label>
              <textarea
                value={form.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Any additional notes about this product…"
                rows={3}
                className="input-field resize-none"
                disabled={saving}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-white border-t border-gray-100 p-4 flex gap-3">
            <button
              type="button"
              onClick={() => !saving && onClose()}
              className="btn-outline flex-1"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex-1"
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving…
                </>
              ) : (
                isEdit ? 'Save Changes' : 'Add Product'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
