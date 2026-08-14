import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Plus, Package } from 'lucide-react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import { stockStatusInfo, debounce, formatMoney, getProductImage } from '../utils/helpers';
import ProductDetailModal from '../components/ProductDetailModal';
import ProductFormModal from '../components/ProductFormModal';

// ─── Category Pills ───────────────────────────────────────────────────────────
function CategoryPill({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 ${
        active
          ? 'bg-blue-500 text-white shadow-sm'
          : 'bg-white text-gray-500 border border-gray-200 hover:border-blue-300 hover:text-blue-500'
      }`}
    >
      {label}
    </button>
  );
}

// ─── Stock Status Badge ───────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const info = stockStatusInfo[status] || { label: status, class: 'badge-blue' };
  return <span className={info.class}>{info.label}</span>;
}

// ─── Product Card ─────────────────────────────────────────────────────────────
function ProductCard({ product, onClick }) {
  const imageUrl = getProductImage(product);
  return (
    <div
      onClick={onClick}
      className="card-hover cursor-pointer select-none overflow-hidden group flex flex-col justify-between"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
    >
      {/* Product Image Header */}
      <div className="relative w-full h-32 bg-slate-100 -mt-4 -mx-4 mb-3 overflow-hidden border-b border-slate-100">
        <img
          src={imageUrl}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80';
          }}
        />
        <div className="absolute top-2 right-2 shadow-md">
          <StatusBadge status={product.stockStatus} />
        </div>
      </div>

      {/* Header row */}
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="min-w-0">
          <h3 className="font-bold text-slate-800 text-sm leading-tight truncate">{product.name}</h3>
          <span className="badge-pink mt-1 inline-block">{product.category?.name || product.category}</span>
        </div>
      </div>

      {/* Stock info */}
      <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
        <span>
          Stock:{' '}
          <span className="font-bold text-slate-700">
            {product.currentStock ?? 0} {product.unit}
          </span>
        </span>
        <span className="text-gray-400">Min: {product.minimumStock ?? 0}</span>
      </div>

      {/* Prices */}
      <div className="mt-2 pt-2 border-t border-pink-50 grid grid-cols-2 gap-1 text-xs">
        <div>
          <p className="text-gray-400">Buying</p>
          <p className="font-bold text-slate-700">
            GH₵{Number(product.buyingPrice ?? 0).toFixed(2)}
          </p>
        </div>
        <div>
          <p className="text-gray-400">Selling</p>
          <p className="font-bold text-blue-600">
            GH₵{Number(product.sellingPrice ?? 0).toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function ProductSkeleton() {
  return (
    <div className="card animate-pulse">
      <div className="h-4 w-3/4 bg-pink-100 rounded mb-2" />
      <div className="h-3 w-16 bg-pink-100 rounded mb-4" />
      <div className="h-3 w-full bg-pink-50 rounded mb-1" />
      <div className="h-3 w-2/3 bg-pink-50 rounded" />
    </div>
  );
}

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'in_stock', label: 'In Stock' },
  { value: 'low_stock', label: 'Low Stock' },
  { value: 'out_of_stock', label: 'Out of Stock' },
];

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ProductsPage() {
  const { isAdmin } = useAuth();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('');
  const [activeStatus, setActiveStatus] = useState('');

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // Debounced search
  const debouncedSetSearch = useRef(
    debounce((val) => setSearchQuery(val), 400)
  ).current;

  const handleSearchChange = (e) => {
    setSearchInput(e.target.value);
    debouncedSetSearch(e.target.value);
  };

  // Fetch categories
  useEffect(() => {
    API.get('/categories')
      .then((res) => setCategories(res.data?.data || res.data || []))
      .catch(() => {});
  }, []);

  // Fetch products
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (searchQuery) params.search = searchQuery;
      if (activeCategory) params.category = activeCategory;
      if (activeStatus) params.status = activeStatus;
      const res = await API.get('/products', { params });
      const list = Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];
      setProducts(list);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load products.');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, activeCategory, activeStatus]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleCardClick = (product) => {
    setSelectedProduct(product);
    setShowDetailModal(true);
  };

  const handleAddProduct = () => {
    setEditingProduct(null);
    setShowFormModal(true);
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setShowDetailModal(false);
    setShowFormModal(true);
  };

  const handleFormSaved = () => {
    setShowFormModal(false);
    fetchProducts();
  };

  return (
    <div className="px-4 py-6 max-w-5xl mx-auto pb-24 sm:pb-8">
      {/* Page Header */}
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Products</h1>
          <p className="page-subtitle">{loading ? '…' : `${products.length} items`}</p>
        </div>
        {isAdmin && (
          <button onClick={handleAddProduct} className="btn-primary">
            <Plus className="w-4 h-4" />
            Add Product
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="search"
          placeholder="Search products…"
          value={searchInput}
          onChange={handleSearchChange}
          className="search-input"
        />
      </div>

      {/* Category Pills */}
      <div className="flex gap-2 overflow-x-auto hide-scrollbar mb-3 pb-1">
        <CategoryPill
          label="All"
          active={activeCategory === ''}
          onClick={() => setActiveCategory('')}
        />
        {categories.map((cat) => (
          <CategoryPill
            key={cat._id || cat.name}
            label={cat.name}
            active={activeCategory === (cat._id || cat.name)}
            onClick={() => setActiveCategory(activeCategory === (cat._id || cat.name) ? '' : (cat._id || cat.name))}
          />
        ))}
      </div>

      {/* Status filter */}
      <div className="flex gap-2 mb-5">
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setActiveStatus(opt.value)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              activeStatus === opt.value
                ? 'bg-slate-800 text-white'
                : 'bg-white text-gray-500 border border-gray-200 hover:border-slate-400'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-4 mb-4 text-sm">
          {error}
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => <ProductSkeleton key={i} />)}
        </div>
      ) : products.length === 0 ? (
        <div className="empty-state">
          <Package className="w-16 h-16 text-pink-200 mb-4" />
          <p className="text-slate-500 font-semibold">No products found</p>
          <p className="text-gray-400 text-sm mt-1">Try adjusting your filters or search query.</p>
          {isAdmin && (
            <button onClick={handleAddProduct} className="btn-primary mt-5">
              <Plus className="w-4 h-4" /> Add First Product
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {products.map((p) => (
            <ProductCard key={p._id} product={p} onClick={() => handleCardClick(p)} />
          ))}
        </div>
      )}

      {/* Modals */}
      {showDetailModal && selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setShowDetailModal(false)}
          onEdit={isAdmin ? () => handleEditProduct(selectedProduct) : undefined}
        />
      )}

      {showFormModal && (
        <ProductFormModal
          product={editingProduct}
          onClose={() => setShowFormModal(false)}
          onSaved={handleFormSaved}
        />
      )}
    </div>
  );
}
