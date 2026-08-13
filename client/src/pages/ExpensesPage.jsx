import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Receipt, Plus, Pencil, Trash2, X, AlertCircle, Loader2,
  Zap, Truck, Droplets, Package, Home, Wrench, Users, HelpCircle,
  CreditCard, Banknote, Smartphone, Calendar,
} from 'lucide-react';
import toast from 'react-hot-toast';
import API from '../services/api';
import { formatMoney, formatDate, expenseCategoryLabels, paymentLabels } from '../utils/helpers';

// ── Category config (icon + color) ─────────────────────────────────────────
const categoryConfig = {
  electricity: { icon: Zap,        color: 'bg-yellow-100 text-yellow-600' },
  transport:   { icon: Truck,       color: 'bg-blue-100   text-blue-600'   },
  ice:         { icon: Droplets,    color: 'bg-cyan-100   text-cyan-600'   },
  packaging:   { icon: Package,     color: 'bg-purple-100 text-purple-600' },
  rent:        { icon: Home,        color: 'bg-pink-100   text-pink-600'   },
  repairs:     { icon: Wrench,      color: 'bg-orange-100 text-orange-600' },
  salaries:    { icon: Users,       color: 'bg-green-100  text-green-600'  },
  other:       { icon: HelpCircle,  color: 'bg-gray-100   text-gray-500'   },
};

const paymentIcons = {
  cash:         Banknote,
  mobile_money: Smartphone,
  bank:         CreditCard,
  other:        CreditCard,
};

// ── Period options ──────────────────────────────────────────────────────────
const PERIOD_OPTIONS = [
  { value: 'week',   label: 'This Week' },
  { value: 'month',  label: 'This Month' },
  { value: 'custom', label: 'Custom' },
];

const CATEGORIES = Object.keys(expenseCategoryLabels);
const PAYMENT_METHODS = Object.keys(paymentLabels);

// ── Skeleton ────────────────────────────────────────────────────────────────
const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse bg-pink-100 rounded-xl ${className}`} />
);

// ── Expense modal ───────────────────────────────────────────────────────────
const EMPTY_FORM = {
  category: 'electricity',
  description: '',
  amount: '',
  date: new Date().toISOString().slice(0, 10),
  paymentMethod: 'cash',
  notes: '',
};

const ExpenseModal = ({ open, onClose, onSaved, editExpense }) => {
  const [form, setForm]     = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const isEdit              = !!editExpense;

  useEffect(() => {
    if (open) {
      setForm(editExpense ? {
        category:      editExpense.category      || 'electricity',
        description:   editExpense.description   || '',
        amount:        editExpense.amount        ?? '',
        date:          editExpense.date          ? editExpense.date.slice(0, 10) : new Date().toISOString().slice(0, 10),
        paymentMethod: editExpense.paymentMethod || 'cash',
        notes:         editExpense.notes         || '',
      } : EMPTY_FORM);
    }
  }, [open, editExpense]);

  if (!open) return null;

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.amount || isNaN(form.amount) || Number(form.amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form, amount: Number(form.amount) };
      let saved;
      if (isEdit) {
        const res = await API.put(`/expenses/${editExpense._id}`, payload);
        saved = res.data.expense || res.data;
        toast.success('Expense updated!');
      } else {
        const res = await API.post('/expenses', payload);
        saved = res.data.expense || res.data;
        toast.success('Expense added!');
      }
      onSaved(saved, isEdit ? 'edit' : 'add');
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save expense');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        <div className="modal-header">
          <h2 className="text-lg font-bold text-navy-800">{isEdit ? 'Edit Expense' : 'Add Expense'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="label">Category</label>
            <select className="input-field" value={form.category} onChange={(e) => set('category', e.target.value)}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{expenseCategoryLabels[c]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Description</label>
            <input className="input-field" placeholder="Brief description…" value={form.description} onChange={(e) => set('description', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Amount (GH₵) <span className="text-red-500">*</span></label>
              <input
                type="number"
                className="input-field"
                placeholder="0.00"
                min="0"
                step="0.01"
                value={form.amount}
                onChange={(e) => set('amount', e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label">Date</label>
              <input type="date" className="input-field" value={form.date} onChange={(e) => set('date', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="label">Payment Method</label>
            <select className="input-field" value={form.paymentMethod} onChange={(e) => set('paymentMethod', e.target.value)}>
              {PAYMENT_METHODS.map((m) => (
                <option key={m} value={m}>{paymentLabels[m]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea
              className="input-field resize-none"
              rows={2}
              placeholder="Optional notes…"
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" className="btn-secondary flex-1" onClick={onClose} disabled={saving}>Cancel</button>
            <button type="submit" className="btn-primary flex-1" disabled={saving}>
              {saving && <Loader2 size={16} className="animate-spin" />}
              {isEdit ? 'Update' : 'Add Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Delete confirm ──────────────────────────────────────────────────────────
const DeleteModal = ({ expense, onClose, onDeleted }) => {
  const [deleting, setDeleting] = useState(false);
  if (!expense) return null;

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await API.delete(`/expenses/${expense._id}`);
      onDeleted(expense._id);
      toast.success('Expense deleted');
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
          <h2 className="text-lg font-bold text-navy-800 mb-2">Delete Expense?</h2>
          <p className="text-sm text-gray-500 mb-6">
            Delete <strong>{expense.description || expenseCategoryLabels[expense.category] || 'this expense'}</strong> of{' '}
            <strong className="text-red-600">{formatMoney(expense.amount)}</strong>? This cannot be undone.
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

// ── Expense card ────────────────────────────────────────────────────────────
const ExpenseCard = ({ expense, onEdit, onDelete }) => {
  const cfg         = categoryConfig[expense.category] || categoryConfig.other;
  const Icon        = cfg.icon;
  const PayIcon     = paymentIcons[expense.paymentMethod] || CreditCard;
  const categoryLabel = expenseCategoryLabels[expense.category] || expense.category || 'Other';
  const payLabel    = paymentLabels[expense.paymentMethod] || expense.paymentMethod || '—';

  return (
    <div className="card hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start gap-3">
        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${cfg.color}`}>
          <Icon size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-semibold text-navy-800 truncate">{expense.description || categoryLabel}</p>
              <span className="badge-blue mt-1">{categoryLabel}</span>
            </div>
            <p className="font-bold text-orange-600 whitespace-nowrap text-sm">{formatMoney(expense.amount)}</p>
          </div>
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
            <span className="flex items-center gap-1"><Calendar size={12} />{formatDate(expense.date)}</span>
            <span className="flex items-center gap-1"><PayIcon size={12} />{payLabel}</span>
          </div>
          {expense.notes && (
            <p className="text-xs text-gray-400 mt-1 line-clamp-1">{expense.notes}</p>
          )}
        </div>
      </div>
      <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
        <button onClick={() => onEdit(expense)} className="flex-1 btn-secondary text-xs py-1.5 px-3">
          <Pencil size={13} /> Edit
        </button>
        <button onClick={() => onDelete(expense)} className="flex-1 btn-danger text-xs py-1.5 px-3">
          <Trash2 size={13} /> Delete
        </button>
      </div>
    </div>
  );
};

// ── Main component ──────────────────────────────────────────────────────────
export default function ExpensesPage() {
  const [expenses, setExpenses]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [period, setPeriod]         = useState('month');
  const [startDate, setStartDate]   = useState('');
  const [endDate, setEndDate]       = useState('');
  const [modalOpen, setModalOpen]   = useState(false);
  const [editExpense, setEditExpense] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { period };
      if (period === 'custom') {
        if (!startDate || !endDate) { setLoading(false); return; }
        params.startDate = startDate;
        params.endDate   = endDate;
      }
      const res = await API.get('/expenses', { params });
      const rawList = res.data?.data || res.data?.expenses || res.data;
      const list = Array.isArray(rawList) ? rawList : [];
      setExpenses(list);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to load expenses';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [period, startDate, endDate]);

  useEffect(() => {
    if (period !== 'custom' || (startDate && endDate)) {
      fetchExpenses();
    }
  }, [fetchExpenses, period, startDate, endDate]);

  const total = useMemo(() => expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0), [expenses]);

  const openAdd  = () => { setEditExpense(null); setModalOpen(true); };
  const openEdit = (e) => { setEditExpense(e);   setModalOpen(true); };

  const handleSaved = (saved, mode) => {
    if (mode === 'add') {
      setExpenses((prev) => [saved, ...prev]);
    } else {
      setExpenses((prev) => prev.map((e) => (e._id === saved._id ? saved : e)));
    }
  };

  const handleDeleted = (id) => setExpenses((prev) => prev.filter((e) => e._id !== id));

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Receipt size={24} className="text-blue-500" /> Expenses
          </h1>
          <p className="page-subtitle">Track all business expenses</p>
        </div>
        <button className="btn-primary" onClick={openAdd}>
          <Plus size={17} /> Add Expense
        </button>
      </div>

      {/* Period filter */}
      <div className="card mb-5 p-3 space-y-3">
        <div className="flex gap-2 flex-wrap">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setPeriod(opt.value)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                period === opt.value ? 'bg-blue-500 text-white shadow-sm' : 'bg-pink-50 text-pink-700 hover:bg-pink-100'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {period === 'custom' && (
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <label className="label">Start Date</label>
              <input type="date" className="input-field" value={startDate} max={endDate || undefined} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="flex-1">
              <label className="label">End Date</label>
              <input type="date" className="input-field" value={endDate} min={startDate || undefined} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
        )}
      </div>

      {/* Error */}
      {error && !loading && (
        <div className="card mb-4 flex items-center gap-3 border-red-200 bg-red-50">
          <AlertCircle size={20} className="text-red-500 shrink-0" />
          <p className="text-red-700 text-sm font-medium flex-1">{error}</p>
          <button className="btn-secondary text-sm" onClick={fetchExpenses}>Retry</button>
        </div>
      )}

      {/* Summary */}
      {!loading && (
        <div className="card mb-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Total Expenses</p>
            <p className="text-2xl font-bold text-orange-600 text-money">{formatMoney(total)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">{expenses.length} expense{expenses.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-36 w-full" />)}
        </div>
      ) : expenses.length === 0 ? (
        <div className="empty-state">
          <Receipt size={52} className="text-pink-200 mb-4" />
          <p className="font-semibold text-gray-500 text-lg">No expenses found</p>
          <p className="text-sm text-gray-400 mt-1 mb-5">No expenses recorded for this period</p>
          <button className="btn-primary" onClick={openAdd}><Plus size={17} /> Add First Expense</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {expenses.map((exp) => (
            <ExpenseCard key={exp._id} expense={exp} onEdit={openEdit} onDelete={setDeleteTarget} />
          ))}
        </div>
      )}

      {/* Modals */}
      <ExpenseModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={handleSaved}
        editExpense={editExpense}
      />
      <DeleteModal
        expense={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onDeleted={handleDeleted}
      />
    </div>
  );
}
