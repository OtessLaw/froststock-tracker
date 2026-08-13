import React, { useState, useEffect, useCallback } from 'react';
import { Users, Plus, Pencil, Trash2, Phone, MapPin, FileText, X, AlertCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import { truncate } from '../utils/helpers';

// ── Skeleton ────────────────────────────────────────────────────────────────
const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse bg-pink-100 rounded-xl ${className}`} />
);

// ── Empty state ─────────────────────────────────────────────────────────────
const EmptyState = ({ onAdd, isAdmin }) => (
  <div className="empty-state">
    <Users size={52} className="text-pink-200 mb-4" />
    <p className="font-semibold text-gray-500 text-lg">No suppliers yet</p>
    <p className="text-sm text-gray-400 mt-1 mb-5">Add your first supplier to get started</p>
    {isAdmin && (
      <button className="btn-primary" onClick={onAdd}>
        <Plus size={17} /> Add Supplier
      </button>
    )}
  </div>
);

// ── Supplier modal ──────────────────────────────────────────────────────────
const EMPTY_FORM = { name: '', phone: '', location: '', notes: '' };

const SupplierModal = ({ open, onClose, onSaved, editSupplier }) => {
  const [form, setForm]       = useState(EMPTY_FORM);
  const [saving, setSaving]   = useState(false);
  const isEdit                = !!editSupplier;

  useEffect(() => {
    if (open) {
      setForm(editSupplier
        ? { name: editSupplier.name || '', phone: editSupplier.phone || '', location: editSupplier.location || '', notes: editSupplier.notes || '' }
        : EMPTY_FORM
      );
    }
  }, [open, editSupplier]);

  if (!open) return null;

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Supplier name is required'); return; }
    setSaving(true);
    try {
      if (isEdit) {
        const res = await API.put(`/suppliers/${editSupplier._id}`, form);
        onSaved(res.data?.data || res.data?.supplier || res.data, 'edit');
        toast.success('Supplier updated!');
      } else {
        const res = await API.post('/suppliers', form);
        onSaved(res.data?.data || res.data?.supplier || res.data, 'add');
        toast.success('Supplier added!');
      }
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save supplier');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        <div className="modal-header">
          <h2 className="text-lg font-bold text-navy-800">{isEdit ? 'Edit Supplier' : 'Add Supplier'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="label">Name <span className="text-red-500">*</span></label>
            <input className="input-field" placeholder="e.g. Akosua Farms" value={form.name} onChange={(e) => set('name', e.target.value)} required />
          </div>
          <div>
            <label className="label">Phone</label>
            <input className="input-field" placeholder="e.g. 024 000 0000" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
          </div>
          <div>
            <label className="label">Location</label>
            <input className="input-field" placeholder="e.g. Kumasi Central Market" value={form.location} onChange={(e) => set('location', e.target.value)} />
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea
              className="input-field resize-none"
              rows={3}
              placeholder="Any additional notes…"
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" className="btn-secondary flex-1" onClick={onClose} disabled={saving}>Cancel</button>
            <button type="submit" className="btn-primary flex-1" disabled={saving}>
              {saving ? <Loader2 size={16} className="animate-spin" /> : null}
              {isEdit ? 'Update' : 'Add Supplier'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Delete confirm modal ────────────────────────────────────────────────────
const DeleteModal = ({ supplier, onClose, onDeleted }) => {
  const [deleting, setDeleting] = useState(false);

  if (!supplier) return null;

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await API.delete(`/suppliers/${supplier._id}`);
      onDeleted(supplier._id);
      toast.success('Supplier deleted');
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content max-w-sm mx-auto">
        <div className="p-6 text-center">
          <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <Trash2 size={24} className="text-red-500" />
          </div>
          <h2 className="text-lg font-bold text-navy-800 mb-2">Delete Supplier?</h2>
          <p className="text-sm text-gray-500 mb-6">
            Are you sure you want to delete <strong>{supplier.name}</strong>? This action cannot be undone.
          </p>
          <div className="flex gap-3">
            <button className="btn-secondary flex-1" onClick={onClose} disabled={deleting}>Cancel</button>
            <button className="btn-danger flex-1" onClick={handleDelete} disabled={deleting}>
              {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Supplier card ────────────────────────────────────────────────────────────
const SupplierCard = ({ supplier, isAdmin, onEdit, onDelete }) => (
  <div className="card hover:shadow-md transition-shadow duration-200">
    <div className="flex items-start justify-between mb-3">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-100 to-pink-100 flex items-center justify-center">
          <span className="text-lg font-bold text-blue-600">{supplier.name?.[0]?.toUpperCase() || '?'}</span>
        </div>
        <div>
          <p className="font-bold text-navy-800">{supplier.name}</p>
          {supplier.location && (
            <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
              <MapPin size={11} /> {truncate(supplier.location, 35)}
            </p>
          )}
        </div>
      </div>
      {isAdmin && (
        <div className="flex gap-1">
          <button onClick={() => onEdit(supplier)}
            className="p-2 rounded-lg text-blue-500 hover:bg-blue-50 transition-colors">
            <Pencil size={15} />
          </button>
          <button onClick={() => onDelete(supplier)}
            className="p-2 rounded-lg text-red-400 hover:bg-red-50 transition-colors">
            <Trash2 size={15} />
          </button>
        </div>
      )}
    </div>
    {supplier.phone && (
      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
        <Phone size={14} className="text-gray-400" />
        <a href={`tel:${supplier.phone}`} className="hover:text-blue-600 transition-colors">{supplier.phone}</a>
      </div>
    )}
    {supplier.notes && (
      <div className="flex items-start gap-2 text-sm text-gray-500 mt-2 pt-2 border-t border-gray-100">
        <FileText size={14} className="text-gray-400 mt-0.5 shrink-0" />
        <p className="line-clamp-2">{supplier.notes}</p>
      </div>
    )}
  </div>
);

// ── Main component ──────────────────────────────────────────────────────────
export default function SuppliersPage() {
  const { isAdmin }             = useAuth();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editSupplier, setEditSupplier] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchSuppliers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await API.get('/suppliers');
      const rawList = res.data?.data || res.data?.suppliers || res.data;
      const list = Array.isArray(rawList) ? rawList : [];
      setSuppliers(list);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to load suppliers';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSuppliers(); }, [fetchSuppliers]);

  const openAdd = () => { setEditSupplier(null); setModalOpen(true); };
  const openEdit = (s) => { setEditSupplier(s); setModalOpen(true); };

  const handleSaved = (saved, mode) => {
    if (mode === 'add') {
      setSuppliers((prev) => [saved, ...prev]);
    } else {
      setSuppliers((prev) => prev.map((s) => (s._id === saved._id ? saved : s)));
    }
  };

  const handleDeleted = (id) => {
    setSuppliers((prev) => prev.filter((s) => s._id !== id));
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Users size={24} className="text-blue-500" /> Suppliers
          </h1>
          <p className="page-subtitle">
            {suppliers.length} supplier{suppliers.length !== 1 ? 's' : ''} registered
          </p>
        </div>
        {isAdmin && (
          <button className="btn-primary" onClick={openAdd}>
            <Plus size={17} /> Add Supplier
          </button>
        )}
      </div>

      {/* Error */}
      {error && !loading && (
        <div className="card mb-5 flex items-center gap-3 border-red-200 bg-red-50">
          <AlertCircle size={20} className="text-red-500 shrink-0" />
          <p className="text-red-700 text-sm font-medium flex-1">{error}</p>
          <button className="btn-secondary text-sm" onClick={fetchSuppliers}>Retry</button>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card space-y-3">
              <div className="flex items-center gap-3">
                <Skeleton className="w-11 h-11 rounded-2xl" />
                <div className="flex-1"><Skeleton className="h-4 w-32 mb-1.5" /><Skeleton className="h-3 w-24" /></div>
              </div>
              <Skeleton className="h-4 w-28" />
            </div>
          ))}
        </div>
      ) : suppliers.length === 0 ? (
        <EmptyState onAdd={openAdd} isAdmin={isAdmin} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {suppliers.map((s) => (
            <SupplierCard
              key={s._id}
              supplier={s}
              isAdmin={isAdmin}
              onEdit={openEdit}
              onDelete={setDeleteTarget}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <SupplierModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={handleSaved}
        editSupplier={editSupplier}
      />
      <DeleteModal
        supplier={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onDeleted={handleDeleted}
      />
    </div>
  );
}
