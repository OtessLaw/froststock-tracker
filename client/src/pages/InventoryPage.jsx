import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Search, Package, Download, AlertCircle, Filter, Boxes,
  TrendingDown, TrendingUp, X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import API from '../services/api';
import { formatMoney, formatQty, stockStatusInfo, debounce } from '../utils/helpers';
import { useAuth } from '../context/AuthContext';

// ── Skeleton ────────────────────────────────────────────────────────────────
const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse bg-pink-100 rounded-xl ${className}`} />
);

// ── Status filter options ───────────────────────────────────────────────────
const STATUS_OPTIONS = [
  { value: 'all',          label: 'All' },
  { value: 'in_stock',     label: 'In Stock' },
  { value: 'low_stock',    label: 'Low Stock' },
  { value: 'out_of_stock', label: 'Out of Stock' },
];

// ── CSV export ──────────────────────────────────────────────────────────────
const exportInventoryCSV = (products) => {
  if (!products?.length) { toast.error('No inventory data to export'); return; }
  const headers = ['Product', 'Category', 'Stock', 'Unit', 'Buying Price (GH₵)', 'Selling Price (GH₵)', 'Stock Value (GH₵)', 'Status'];
  const rows = products.map((p) => [
    p.name,
    p.category || '',
    p.stockQty ?? p.stock ?? 0,
    p.unit || '',
    p.buyingPrice ?? '',
    p.sellingPrice ?? '',
    (p.stockQty ?? p.stock ?? 0) * (p.buyingPrice ?? 0),
    stockStatusInfo[p.stockStatus || p.status]?.label || p.stockStatus || '',
  ]);
  const csv = [headers, ...rows]
    .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `inventory_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  toast.success('Inventory CSV exported!');
};

// ── Status badge ────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const info = stockStatusInfo[status] || { label: status, class: 'badge-blue' };
  return <span className={info.class}>{info.label}</span>;
};

// ── Mobile product card ─────────────────────────────────────────────────────
const ProductCard = ({ product }) => {
  const qty      = product.stockQty ?? product.stock ?? 0;
  const buying   = product.buyingPrice ?? 0;
  const selling  = product.sellingPrice ?? 0;
  const value    = qty * buying;
  const status   = product.stockStatus || product.status || 'in_stock';

  return (
    <div className="mobile-card">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-navy-800 truncate">{product.name}</p>
          <span className="badge-blue mt-1">{product.category || 'Uncategorised'}</span>
        </div>
        <StatusBadge status={status} />
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm mt-3">
        <div>
          <p className="text-gray-500 text-xs">Stock</p>
          <p className="font-semibold text-navy-800">{formatQty(qty, product.unit)}</p>
        </div>
        <div>
          <p className="text-gray-500 text-xs">Buying Price</p>
          <p className="font-semibold text-navy-800">{formatMoney(buying)}</p>
        </div>
        <div>
          <p className="text-gray-500 text-xs">Selling Price</p>
          <p className="font-semibold text-green-600">{formatMoney(selling)}</p>
        </div>
        <div>
          <p className="text-gray-500 text-xs">Stock Value</p>
          <p className="font-semibold text-navy-800">{formatMoney(value)}</p>
        </div>
      </div>
    </div>
  );
};

// ── Main component ──────────────────────────────────────────────────────────
export default function InventoryPage() {
  const { isAdmin }          = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [search, setSearch]     = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeStatus, setActiveStatus]     = useState('all');

  // Summary derived from raw data
  const [summary, setSummary] = useState({
    totalCost: 0,
    totalSelling: 0,
    totalProducts: 0,
    lowStockCount: 0,
  });

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await API.get('/reports/inventory');
      const payload = res.data?.data || res.data || {};
      const rawList = payload.inventory || payload.products || payload;
      const list = Array.isArray(rawList) ? rawList : [];
      setProducts(list);
      // Compute summary
      let totalCost    = payload.totalCostValue ?? 0;
      let totalSelling = payload.totalSellingValue ?? 0;
      let lowCount     = payload.lowStockCount ?? 0;

      if (!payload.totalCostValue && list.length > 0) {
        totalCost = 0; totalSelling = 0; lowCount = 0;
        list.forEach((p) => {
          const qty     = p.currentStock ?? p.stockQty ?? p.stock ?? 0;
          totalCost    += qty * (p.buyingPrice ?? 0);
          totalSelling += qty * (p.sellingPrice ?? 0);
          const st      = p.stockStatus || p.status || '';
          if (st === 'low_stock' || st === 'out_of_stock') lowCount++;
        });
      }
      setSummary({
        totalCost,
        totalSelling,
        totalProducts: payload.totalProducts ?? list.length,
        lowStockCount: lowCount,
      });
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to load inventory';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchInventory(); }, [fetchInventory]);

  // Debounce search input
  const debouncedSetSearch = useMemo(() => debounce(setSearch, 300), []);
  const handleSearchChange = (e) => {
    setSearchInput(e.target.value);
    debouncedSetSearch(e.target.value);
  };

  // Extract unique categories
  const categories = useMemo(() => {
    const cats = ['all', ...new Set(products.map((p) => p.category).filter(Boolean))];
    return cats;
  }, [products]);

  // Filter products
  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchSearch   = !search || p.name?.toLowerCase().includes(search.toLowerCase());
      const matchCategory = activeCategory === 'all' || p.category === activeCategory;
      const status        = p.stockStatus || p.status || 'in_stock';
      const matchStatus   = activeStatus === 'all' || status === activeStatus;
      return matchSearch && matchCategory && matchStatus;
    });
  }, [products, search, activeCategory, activeStatus]);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Page header */}
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Boxes size={24} className="text-blue-500" /> Inventory
          </h1>
          <p className="page-subtitle">Stock levels, values &amp; status</p>
        </div>
        {isAdmin && (
          <button className="btn-outline text-sm self-start sm:self-auto" onClick={() => exportInventoryCSV(filtered)}>
            <Download size={16} /> Export CSV
          </button>
        )}
      </div>

      {/* Error */}
      {error && !loading && (
        <div className="card mb-4 flex items-center gap-3 border-red-200 bg-red-50">
          <AlertCircle size={20} className="text-red-500 shrink-0" />
          <p className="text-red-700 text-sm font-medium flex-1">{error}</p>
          <button className="btn-secondary text-sm" onClick={fetchInventory}>Retry</button>
        </div>
      )}

      {/* Summary cards */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card"><Skeleton className="h-4 w-24 mb-2" /><Skeleton className="h-7 w-32" /></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="stat-card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Inventory Cost</span>
              <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
                <TrendingDown size={16} className="text-white" />
              </div>
            </div>
            <p className="text-xl font-bold text-navy-800 text-money">{formatMoney(summary.totalCost)}</p>
          </div>
          <div className="stat-card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Est. Selling Value</span>
              <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center">
                <TrendingUp size={16} className="text-white" />
              </div>
            </div>
            <p className="text-xl font-bold text-navy-800 text-money">{formatMoney(summary.totalSelling)}</p>
          </div>
          <div className="stat-card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total Products</span>
              <div className="w-8 h-8 rounded-lg bg-pink-500 flex items-center justify-center">
                <Package size={16} className="text-white" />
              </div>
            </div>
            <p className="text-xl font-bold text-navy-800">{summary.totalProducts}</p>
          </div>
          <div className="stat-card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Low / Out of Stock</span>
              <div className="w-8 h-8 rounded-lg bg-red-500 flex items-center justify-center">
                <AlertCircle size={16} className="text-white" />
              </div>
            </div>
            <p className="text-xl font-bold text-red-600">{summary.lowStockCount}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card mb-4 space-y-3">
        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search products…"
            className="search-input"
            value={searchInput}
            onChange={handleSearchChange}
          />
          {searchInput && (
            <button className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              onClick={() => { setSearchInput(''); setSearch(''); }}>
              <X size={15} />
            </button>
          )}
        </div>

        {/* Category chips */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                activeCategory === cat
                  ? 'bg-blue-500 text-white'
                  : 'bg-pink-50 text-pink-700 hover:bg-pink-100'
              }`}
            >
              {cat === 'all' ? 'All Categories' : cat}
            </button>
          ))}
        </div>

        {/* Status filter */}
        <div className="flex gap-2 flex-wrap">
          <Filter size={14} className="text-gray-400 self-center" />
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setActiveStatus(opt.value)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all duration-200 ${
                activeStatus === opt.value
                  ? opt.value === 'all'          ? 'bg-blue-500 text-white'
                  : opt.value === 'in_stock'     ? 'bg-green-500 text-white'
                  : opt.value === 'low_stock'    ? 'bg-amber-500 text-white'
                  : 'bg-red-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Count */}
      {!loading && (
        <p className="text-xs text-gray-500 mb-3">
          Showing <span className="font-semibold text-navy-700">{filtered.length}</span> of {products.length} products
        </p>
      )}

      {/* Desktop table */}
      {loading ? (
        <div className="card space-y-3">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <Package size={48} className="text-pink-200 mb-4" />
          <p className="font-semibold text-gray-500">No products found</p>
          <p className="text-sm text-gray-400 mt-1">Try adjusting your filters or search</p>
        </div>
      ) : (
        <>
          {/* Desktop */}
          <div className="hidden md:block table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th className="text-right">Stock</th>
                  <th>Unit</th>
                  <th className="text-right">Buying Price</th>
                  <th className="text-right">Selling Price</th>
                  <th className="text-right">Stock Value</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => {
                  const qty    = p.stockQty ?? p.stock ?? 0;
                  const buying = p.buyingPrice ?? 0;
                  const value  = qty * buying;
                  const status = p.stockStatus || p.status || 'in_stock';
                  return (
                    <tr key={p._id}>
                      <td className="font-semibold text-navy-800">{p.name}</td>
                      <td><span className="badge-blue">{p.category || '—'}</span></td>
                      <td className="text-right font-semibold">{qty.toLocaleString()}</td>
                      <td className="text-gray-500">{p.unit || '—'}</td>
                      <td className="text-right text-money">{formatMoney(buying)}</td>
                      <td className="text-right text-green-600 font-semibold">{formatMoney(p.sellingPrice ?? 0)}</td>
                      <td className="text-right text-money">{formatMoney(value)}</td>
                      <td><StatusBadge status={status} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {filtered.map((p) => <ProductCard key={p._id} product={p} />)}
          </div>
        </>
      )}
    </div>
  );
}
