import React, { useState, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  Plus, History, SlidersHorizontal, Search, ChevronDown,
  Loader2, Package, TrendingUp, TrendingDown, Activity,
  Calendar, User, ClipboardList, Hash, FileText, Check
} from 'lucide-react';
import API from '../services/api';

const formatCurrency = (amount) =>
  `GH₵${Number(amount || 0).toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('en-GH', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
};

const ADJUST_REASONS = [
  { value: 'damaged', label: 'Damaged' },
  { value: 'spoiled', label: 'Spoiled' },
  { value: 'missing', label: 'Missing' },
  { value: 'wrong_entry', label: 'Wrong Entry' },
  { value: 'physical_count', label: 'Physical Count' },
  { value: 'other', label: 'Other' },
];

const STOCK_TYPE_FILTERS = [
  { value: '', label: 'All' },
  { value: 'add', label: 'Added' },
  { value: 'sale', label: 'Sale' },
  { value: 'adjust', label: 'Adjusted' },
];

const stockTypeStyle = (type) => {
  const t = (type || '').toLowerCase();
  if (t === 'add' || t === 'added') return 'bg-green-100 text-green-700 border-green-200';
  if (t === 'sale' || t === 'sold') return 'bg-red-100 text-red-700 border-red-200';
  if (t === 'adjust' || t === 'adjusted') return 'bg-amber-100 text-amber-700 border-amber-200';
  return 'bg-gray-100 text-gray-600 border-gray-200';
};

const stockTypeIcon = (type) => {
  const t = (type || '').toLowerCase();
  if (t === 'add' || t === 'added') return TrendingUp;
  if (t === 'sale' || t === 'sold') return TrendingDown;
  return Activity;
};

const stockTypeLabel = (type) => {
  const t = (type || '').toLowerCase();
  if (t === 'add' || t === 'added') return 'Added';
  if (t === 'sale' || t === 'sold') return 'Sale';
  if (t === 'adjust' || t === 'adjusted') return 'Adjusted';
  return type || '—';
};

// ─── Searchable Product Dropdown ─────────────────────────────────────────────
function ProductSelect({ products, value, onChange, placeholder = 'Select product...' }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const ref = useRef(null);

  const selected = products.find((p) => p._id === value);
  const filtered = products.filter((p) =>
    p.name?.toLowerCase().includes(q.toLowerCase())
  );

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((s) => !s)}
        className="w-full flex items-center justify-between border border-pink-200 rounded-xl px-3 py-2.5 bg-white text-sm text-left focus:outline-none focus:ring-2 focus:ring-blue-400 hover:border-blue-300 transition-colors"
      >
        <span className={selected ? 'text-gray-800 font-medium' : 'text-gray-400'}>
          {selected ? selected.name : placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute z-30 mt-1 w-full bg-white border border-pink-100 rounded-xl shadow-xl overflow-hidden">
          <div className="p-2 border-b border-pink-100">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                autoFocus
                type="text"
                placeholder="Search..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-pink-200 rounded-lg focus:outline-none focus:border-blue-400"
              />
            </div>
          </div>
          <div className="max-h-52 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-400 text-center">No products found</div>
            ) : (
              filtered.map((p) => (
                <button
                  key={p._id}
                  type="button"
                  onClick={() => { onChange(p._id); setOpen(false); setQ(''); }}
                  className={`w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 transition-colors flex items-center justify-between ${
                    p._id === value ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700'
                  }`}
                >
                  <span>{p.name}</span>
                  <span className="text-xs text-gray-400">{p.unit || 'pcs'}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Label + Input helpers ────────────────────────────────────────────────────
function Label({ children, required }) {
  return (
    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
      {children} {required && <span className="text-red-400">*</span>}
    </label>
  );
}

function InputField({ ...props }) {
  return (
    <input
      {...props}
      className="w-full border border-pink-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-white placeholder-gray-300"
    />
  );
}

// ─── TAB 1: Add Stock ─────────────────────────────────────────────────────────
function AddStockTab({ products, suppliers, onSuccess }) {
  const [form, setForm] = useState({
    productId: '',
    quantity: '',
    buyingPrice: '',
    supplierId: '',
    batchNumber: '',
    expiryDate: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const selectedProduct = products.find((p) => p._id === form.productId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.productId) { toast.error('Select a product'); return; }
    if (!form.quantity || parseFloat(form.quantity) <= 0) { toast.error('Enter a valid quantity'); return; }
    setSubmitting(true);
    try {
      const payload = {
        productId: form.productId,
        quantity: parseFloat(form.quantity),
        ...(form.buyingPrice && { buyingPrice: parseFloat(form.buyingPrice) }),
        ...(form.supplierId && { supplierId: form.supplierId }),
        ...(form.batchNumber && { batchNumber: form.batchNumber }),
        ...(form.expiryDate && { expiryDate: form.expiryDate }),
        ...(form.notes && { notes: form.notes }),
      };
      await API.post('/stock/add', payload);
      toast.success(`Stock added for ${selectedProduct?.name || 'product'}`);
      setForm({ productId: '', quantity: '', buyingPrice: '', supplierId: '', batchNumber: '', expiryDate: '', notes: '' });
      onSuccess?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add stock');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl mx-auto">
      {/* Product */}
      <div>
        <Label required>Product</Label>
        <ProductSelect
          products={products}
          value={form.productId}
          onChange={(id) => setForm((f) => ({ ...f, productId: id }))}
        />
        {selectedProduct && (
          <div className="mt-2 flex items-center gap-3 px-3 py-2 bg-blue-50 rounded-xl border border-blue-100">
            <Package className="w-4 h-4 text-blue-400 flex-shrink-0" />
            <div className="text-xs text-blue-700">
              <span className="font-semibold">Current stock:</span> {selectedProduct.currentStock} {selectedProduct.unit || 'pcs'}
              {selectedProduct.sellingPrice && (
                <span className="ml-3"><span className="font-semibold">Selling:</span> {formatCurrency(selectedProduct.sellingPrice)}</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Quantity + Buying Price */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label required>Quantity</Label>
          <InputField
            type="number"
            min="0.01"
            step="0.01"
            placeholder="0.00"
            value={form.quantity}
            onChange={update('quantity')}
          />
        </div>
        <div>
          <Label>Buying Price (GH₵)</Label>
          <InputField
            type="number"
            min="0"
            step="0.01"
            placeholder="Optional"
            value={form.buyingPrice}
            onChange={update('buyingPrice')}
          />
          <p className="text-xs text-gray-400 mt-1">Updates product cost if provided</p>
        </div>
      </div>

      {/* Supplier */}
      <div>
        <Label>Supplier</Label>
        <select
          value={form.supplierId}
          onChange={update('supplierId')}
          className="w-full border border-pink-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-gray-700"
        >
          <option value="">Select supplier (optional)</option>
          {suppliers.map((s) => (
            <option key={s._id} value={s._id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {/* Batch Number + Expiry Date */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Batch Number</Label>
          <InputField
            type="text"
            placeholder="Optional"
            value={form.batchNumber}
            onChange={update('batchNumber')}
          />
        </div>
        <div>
          <Label>Expiry Date</Label>
          <InputField
            type="date"
            value={form.expiryDate}
            onChange={update('expiryDate')}
          />
        </div>
      </div>

      {/* Notes */}
      <div>
        <Label>Notes</Label>
        <textarea
          placeholder="Optional notes..."
          value={form.notes}
          onChange={update('notes')}
          rows={3}
          className="w-full border border-pink-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-white placeholder-gray-300 resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl text-base transition-colors flex items-center justify-center gap-3 shadow-lg shadow-blue-200 mt-2"
      >
        {submitting ? (
          <><Loader2 className="w-5 h-5 animate-spin" /> Adding Stock...</>
        ) : (
          <><Plus className="w-5 h-5" /> Add Stock</>
        )}
      </button>
    </form>
  );
}

// ─── TAB 2: Stock History ─────────────────────────────────────────────────────
function StockHistoryTab({ products }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [productFilter, setProductFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const PAGE_SIZE = 20;

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: PAGE_SIZE,
        ...(productFilter && { productId: productFilter }),
        ...(typeFilter && { type: typeFilter }),
      };
      const res = await API.get('/stock/history', { params });
      const data = res.data?.data || res.data;
      const list = Array.isArray(data?.logs) ? data.logs
        : Array.isArray(data?.history) ? data.history
        : Array.isArray(data?.docs) ? data.docs
        : Array.isArray(data) ? data : [];
      setHistory(list);
      setTotalCount(data?.total || data?.totalDocs || list.length);
    } catch {
      toast.error('Failed to load stock history');
    } finally {
      setLoading(false);
    }
  }, [page, productFilter, typeFilter]);

  useEffect(() => { setPage(1); }, [productFilter, typeFilter]);
  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <ProductSelect
            products={[{ _id: '', name: 'All Products' }, ...products]}
            value={productFilter}
            onChange={setProductFilter}
            placeholder="Filter by product..."
          />
        </div>
        <div className="flex gap-2">
          {STOCK_TYPE_FILTERS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setTypeFilter(value)}
              className={`px-3 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                typeFilter === value
                  ? 'bg-blue-500 text-white border-blue-500 shadow-sm'
                  : 'bg-white text-gray-600 border-pink-200 hover:border-blue-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Table/Cards */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
        </div>
      ) : history.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <History className="w-14 h-14 mb-3 opacity-30" />
          <p className="text-base font-medium text-gray-400">No history records found</p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block bg-white rounded-2xl border border-pink-100 overflow-hidden shadow-sm">
            <table className="w-full">
              <thead className="bg-pink-50 border-b border-pink-100">
                <tr>
                  {['Date', 'Product', 'Type', 'Change', 'Previous', 'New Stock', 'User'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-pink-50">
                {history.map((log, idx) => {
                  const TypeIcon = stockTypeIcon(log.type);
                  const change = log.quantityChange || log.change || log.quantity || 0;
                  const isPositive = change > 0;
                  return (
                    <tr key={log._id || idx} className="hover:bg-pink-50/50 transition-colors">
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                        {formatDate(log.createdAt || log.date)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-gray-700">
                          {log.product?.name || log.productName || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${stockTypeStyle(log.type)}`}>
                          <TypeIcon className="w-3 h-3" />
                          {stockTypeLabel(log.type)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-bold text-sm ${isPositive ? 'text-green-600' : 'text-red-500'}`}>
                          {isPositive ? '+' : ''}{change} {log.product?.unit || log.unit || 'pcs'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {log.previousStock ?? log.previousQuantity ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-700">
                        {log.newStock ?? log.newQuantity ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">
                        {log.user?.name || log.userName || log.createdBy?.name || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {history.map((log, idx) => {
              const TypeIcon = stockTypeIcon(log.type);
              const change = log.quantityChange || log.change || log.quantity || 0;
              const isPositive = change > 0;
              return (
                <div
                  key={log._id || idx}
                  className="bg-white rounded-2xl border border-pink-100 p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">
                        {log.product?.name || log.productName || '—'}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{formatDate(log.createdAt || log.date)}</p>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${stockTypeStyle(log.type)}`}>
                      <TypeIcon className="w-3 h-3" />
                      {stockTypeLabel(log.type)}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div>
                      <p className="text-xs text-gray-400">Change</p>
                      <p className={`font-bold ${isPositive ? 'text-green-600' : 'text-red-500'}`}>
                        {isPositive ? '+' : ''}{change} {log.product?.unit || log.unit || 'pcs'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Previous</p>
                      <p className="font-medium text-gray-600">{log.previousStock ?? log.previousQuantity ?? '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">New Stock</p>
                      <p className="font-bold text-gray-800">{log.newStock ?? log.newQuantity ?? '—'}</p>
                    </div>
                    {(log.user?.name || log.userName || log.createdBy?.name) && (
                      <div className="ml-auto">
                        <p className="text-xs text-gray-400">By</p>
                        <p className="text-xs font-medium text-gray-500">
                          {log.user?.name || log.userName || log.createdBy?.name}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-white rounded-2xl border border-pink-100 px-4 py-3 shadow-sm">
              <p className="text-sm text-gray-500">
                Page <strong>{page}</strong> of <strong>{totalPages}</strong>
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="px-3 py-1.5 rounded-lg border border-pink-200 text-sm text-gray-600 hover:bg-pink-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Prev
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="px-3 py-1.5 rounded-lg border border-pink-200 text-sm text-gray-600 hover:bg-pink-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── TAB 3: Adjust Stock ─────────────────────────────────────────────────────
function AdjustStockTab({ products, onSuccess }) {
  const [form, setForm] = useState({
    productId: '',
    newQuantity: '',
    reason: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  const selectedProduct = products.find((p) => p._id === form.productId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.productId) { toast.error('Select a product'); return; }
    if (form.newQuantity === '' || parseFloat(form.newQuantity) < 0) { toast.error('Enter a valid new quantity'); return; }
    if (!form.reason) { toast.error('Select a reason'); return; }
    setSubmitting(true);
    try {
      await API.post('/stock/adjust', {
        productId: form.productId,
        newQuantity: parseFloat(form.newQuantity),
        reason: form.reason,
      });
      toast.success(`Stock adjusted for ${selectedProduct?.name || 'product'}`);
      setForm({ productId: '', newQuantity: '', reason: '' });
      onSuccess?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to adjust stock');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-lg mx-auto">
      <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 text-sm text-amber-700 flex items-start gap-2">
        <SlidersHorizontal className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <span>Stock adjustments are permanent and logged. Use only when necessary.</span>
      </div>

      {/* Product */}
      <div>
        <Label required>Product</Label>
        <ProductSelect
          products={products}
          value={form.productId}
          onChange={(id) => setForm((f) => ({ ...f, productId: id, newQuantity: '' }))}
        />
      </div>

      {/* Current Stock Display */}
      {selectedProduct && (
        <div className="bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <Package className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <p className="text-xs text-blue-400 font-medium">Current Stock</p>
            <p className="text-lg font-extrabold text-blue-700">
              {selectedProduct.currentStock} <span className="text-sm font-normal text-blue-400">{selectedProduct.unit || 'pcs'}</span>
            </p>
          </div>
        </div>
      )}

      {/* New Quantity */}
      <div>
        <Label required>New Quantity</Label>
        <InputField
          type="number"
          min="0"
          step="0.01"
          placeholder="Enter new stock quantity"
          value={form.newQuantity}
          onChange={update('newQuantity')}
          disabled={!form.productId}
        />
        {selectedProduct && form.newQuantity !== '' && (
          <p className="text-xs mt-1.5 font-medium">
            {parseFloat(form.newQuantity) > selectedProduct.currentStock ? (
              <span className="text-green-600">
                +{(parseFloat(form.newQuantity) - selectedProduct.currentStock).toFixed(2)} {selectedProduct.unit || 'pcs'} increase
              </span>
            ) : parseFloat(form.newQuantity) < selectedProduct.currentStock ? (
              <span className="text-red-500">
                -{(selectedProduct.currentStock - parseFloat(form.newQuantity)).toFixed(2)} {selectedProduct.unit || 'pcs'} reduction
              </span>
            ) : (
              <span className="text-gray-400">No change</span>
            )}
          </p>
        )}
      </div>

      {/* Reason */}
      <div>
        <Label required>Reason</Label>
        <select
          value={form.reason}
          onChange={update('reason')}
          className="w-full border border-pink-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-gray-700"
        >
          <option value="">Select reason...</option>
          {ADJUST_REASONS.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        disabled={submitting || !form.productId}
        className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl text-base transition-colors flex items-center justify-center gap-3 shadow-lg shadow-amber-200 mt-2"
      >
        {submitting ? (
          <><Loader2 className="w-5 h-5 animate-spin" /> Adjusting...</>
        ) : (
          <><Check className="w-5 h-5" /> Adjust Stock</>
        )}
      </button>
    </form>
  );
}

// ─── Main StockPage ───────────────────────────────────────────────────────────
const TABS = [
  { id: 'add', label: 'Add Stock', icon: Plus },
  { id: 'history', label: 'Stock History', icon: History },
  { id: 'adjust', label: 'Adjust Stock', icon: SlidersHorizontal },
];

export default function StockPage() {
  const [activeTab, setActiveTab] = useState('add');
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  const fetchMasterData = useCallback(async () => {
    setLoadingData(true);
    try {
      const [prodRes, suppRes] = await Promise.all([
        API.get('/products'),
        API.get('/suppliers').catch(() => ({ data: [] })),
      ]);
      const prods = Array.isArray(prodRes.data?.data) ? prodRes.data.data
        : Array.isArray(prodRes.data) ? prodRes.data : [];
      const supps = Array.isArray(suppRes.data?.data) ? suppRes.data.data
        : Array.isArray(suppRes.data) ? suppRes.data : [];
      setProducts(prods);
      setSuppliers(supps);
    } catch {
      toast.error('Failed to load product data');
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => { fetchMasterData(); }, [fetchMasterData]);

  return (
    <div className="min-h-screen bg-pink-50">
      {/* Header */}
      <div className="bg-white border-b border-pink-100 shadow-sm sticky top-0 z-10">
        <div className="px-4 pt-4 max-w-5xl mx-auto">
          <h1 className="text-xl font-bold text-gray-800 mb-4">Stock Management</h1>
          {/* Tabs */}
          <div className="flex gap-1 border-b border-pink-100">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all -mb-px ${
                  activeTab === id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-pink-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{label}</span>
                <span className="sm:hidden">
                  {id === 'add' ? 'Add' : id === 'history' ? 'History' : 'Adjust'}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="px-4 py-6 max-w-5xl mx-auto">
        {loadingData ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
          </div>
        ) : (
          <>
            {activeTab === 'add' && (
              <AddStockTab products={products} suppliers={suppliers} onSuccess={fetchMasterData} />
            )}
            {activeTab === 'history' && (
              <StockHistoryTab products={products} />
            )}
            {activeTab === 'adjust' && (
              <AdjustStockTab products={products} onSuccess={fetchMasterData} />
            )}
          </>
        )}
      </div>
    </div>
  );
}
