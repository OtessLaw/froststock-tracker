import React, { useState, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  Search, X, Plus, Minus, ShoppingCart, ChevronUp,
  CreditCard, Smartphone, Building2, MoreHorizontal,
  Package, Loader2, Tag, CheckCircle, Trash2
} from 'lucide-react';
import ReceiptModal from '../components/ReceiptModal';
import API from '../services/api';
import { getProductImage } from '../utils/helpers';

const formatCurrency = (amount) =>
  `GH₵${Number(amount || 0).toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash', icon: CreditCard },
  { value: 'mobile_money', label: 'Mobile Money', icon: Smartphone },
  { value: 'bank', label: 'Bank', icon: Building2 },
  { value: 'other', label: 'Other', icon: MoreHorizontal },
];

export default function SalesPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [cartOpen, setCartOpen] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [receiptData, setReceiptData] = useState(null);

  // Quantity popup state
  const [popup, setPopup] = useState(null); // { product, qty }
  const popupRef = useRef(null);

  // Fetch products + categories
  const fetchData = useCallback(async () => {
    setLoadingProducts(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        API.get('/products'),
        API.get('/categories'),
      ]);
      const prods = Array.isArray(prodRes.data?.data)
        ? prodRes.data.data
        : Array.isArray(prodRes.data)
        ? prodRes.data
        : [];
      const cats = Array.isArray(catRes.data?.data)
        ? catRes.data.data
        : Array.isArray(catRes.data)
        ? catRes.data
        : [];
      setProducts(prods);
      setCategories(cats);
    } catch {
      toast.error('Failed to load products');
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Close popup on outside click
  useEffect(() => {
    const handler = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        setPopup(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Filtered products
  const filtered = products.filter((p) => {
    const matchSearch = p.name?.toLowerCase().includes(search.toLowerCase());
    const matchCat =
      activeCategory === 'all' ||
      p.category?.toLowerCase() === activeCategory.toLowerCase() ||
      p.categoryId === activeCategory ||
      p.category?._id === activeCategory;
    return matchSearch && matchCat;
  });

  // Cart helpers
  const cartTotal = cart.reduce((sum, i) => sum + i.subtotal, 0);
  const cartCount = cart.reduce((sum, i) => sum + Number(i.quantity), 0);

  const addToCart = (product, qty) => {
    const quantity = parseFloat(qty);
    if (!quantity || quantity <= 0) {
      toast.error('Enter a valid quantity');
      return;
    }
    if (quantity > product.currentStock) {
      toast.error(`Not enough stock for ${product.name}`);
      return;
    }
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product._id);
      if (existing) {
        const newQty = parseFloat((existing.quantity + quantity).toFixed(4));
        if (newQty > product.currentStock) {
          toast.error(`Not enough stock for ${product.name}`);
          return prev;
        }
        return prev.map((i) =>
          i.productId === product._id
            ? { ...i, quantity: newQty, subtotal: newQty * i.unitPrice }
            : i
        );
      }
      return [
        ...prev,
        {
          productId: product._id,
          productName: product.name,
          unit: product.unit || 'pcs',
          quantity,
          unitPrice: product.sellingPrice || product.price || 0,
          subtotal: quantity * (product.sellingPrice || product.price || 0),
          maxStock: product.currentStock,
        },
      ];
    });
    setPopup(null);
    setCartOpen(true);
  };

  const removeFromCart = (productId) =>
    setCart((prev) => prev.filter((i) => i.productId !== productId));

  const updateQty = (productId, newQty) => {
    const qty = parseFloat(newQty);
    setCart((prev) =>
      prev.map((i) => {
        if (i.productId !== productId) return i;
        if (isNaN(qty) || qty <= 0) return { ...i, quantity: '', subtotal: 0 };
        if (qty > i.maxStock) {
          toast.error(`Max stock: ${i.maxStock}`);
          return i;
        }
        return { ...i, quantity: qty, subtotal: qty * i.unitPrice };
      })
    );
  };

  const clearCart = () => { setCart([]); setCartOpen(false); };

  // Complete sale
  const completeSale = async () => {
    if (cart.length === 0) { toast.error('Cart is empty'); return; }
    const invalid = cart.find((i) => !i.quantity || i.quantity <= 0);
    if (invalid) { toast.error('Fix invalid quantities in cart'); return; }
    setCompleting(true);
    try {
      const res = await API.post('/sales', {
        items: cart.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        paymentMethod,
      });
      const sale = res.data?.data || res.data;
      setReceiptData(sale);
      clearCart();
      fetchData(); // refresh stock
      toast.success('Sale completed!');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to complete sale';
      toast.error(msg);
    } finally {
      setCompleting(false);
    }
  };

  // Quantity popup handlers
  const openPopup = (product) => {
    if (product.currentStock <= 0) return;
    setPopup({ product, qty: '1' });
  };

  return (
    <div className="flex flex-col lg:flex-row h-full min-h-screen bg-pink-50">
      {/* ── LEFT PANEL: Product Selector ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-pink-100 px-4 py-4 shadow-sm">
          <h1 className="text-xl font-bold text-gray-800 mb-3">Quick Sale</h1>
          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search product..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-pink-200 bg-pink-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          {/* Category chips */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <button
              onClick={() => setActiveCategory('all')}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                activeCategory === 'all'
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'bg-pink-100 text-gray-600 hover:bg-pink-200'
              }`}
            >
              All
            </button>
            {categories.map((cat) => {
              const id = cat._id || cat.id || cat.name;
              const name = cat.name || cat;
              return (
                <button
                  key={id}
                  onClick={() => setActiveCategory(id)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    activeCategory === id
                      ? 'bg-blue-500 text-white shadow-sm'
                      : 'bg-pink-100 text-gray-600 hover:bg-pink-200'
                  }`}
                >
                  {name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {loadingProducts ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
              <Package className="w-12 h-12 mb-3 opacity-40" />
              <p className="text-sm">No products found</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-3">
              {filtered.map((product) => {
                const outOfStock = product.currentStock <= 0;
                const inCart = cart.find((i) => i.productId === product._id);
                return (
                  <button
                    key={product._id}
                    onClick={() => openPopup(product)}
                    disabled={outOfStock}
                    className={`relative text-left rounded-2xl border-2 p-3 transition-all focus:outline-none ${
                      outOfStock
                        ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                        : inCart
                        ? 'border-blue-400 bg-blue-50 shadow-md'
                        : 'border-pink-200 bg-white hover:border-blue-300 hover:shadow-md active:scale-95'
                    }`}
                  >
                    {inCart && (
                      <span className="absolute top-2 right-2 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                        {inCart.quantity}
                      </span>
                    )}
                    <div className="relative w-full h-28 rounded-xl bg-slate-100 mb-2.5 overflow-hidden border border-slate-100">
                      <img
                        src={getProductImage(product)}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80';
                        }}
                      />
                    </div>
                    <p className="font-semibold text-sm text-gray-800 leading-tight mb-1 line-clamp-2">
                      {product.name}
                    </p>
                    <p className="text-xs text-gray-400 mb-2 flex items-center gap-1">
                      <Tag className="w-3 h-3" />
                      {product.category?.name || product.category || 'Uncategorised'}
                    </p>
                    <p className="text-blue-600 font-bold text-sm">
                      {formatCurrency(product.sellingPrice || product.price)}
                    </p>
                    <p className={`text-xs mt-1 font-medium ${outOfStock ? 'text-red-400' : 'text-green-600'}`}>
                      {outOfStock ? 'Out of stock' : `Stock: ${product.currentStock} ${product.unit || 'pcs'}`}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Mobile cart FAB */}
        {cart.length > 0 && (
          <div className="lg:hidden fixed bottom-20 right-4 z-30">
            <button
              onClick={() => setCartOpen(true)}
              className="relative bg-blue-500 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-xl active:scale-95 transition-transform"
            >
              <ShoppingCart className="w-6 h-6" />
              <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                {cart.length}
              </span>
            </button>
          </div>
        )}
      </div>

      {/* ── QUANTITY POPUP ── */}
      {popup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div
            ref={popupRef}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-fade-in"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-bold text-gray-800 text-lg leading-tight">{popup.product.name}</h3>
                <p className="text-blue-600 font-semibold mt-1">
                  {formatCurrency(popup.product.sellingPrice || popup.product.price)} / {popup.product.unit || 'pcs'}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Available: {popup.product.currentStock} {popup.product.unit || 'pcs'}
                </p>
              </div>
              <button onClick={() => setPopup(null)} className="text-gray-400 hover:text-gray-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stepper */}
            <div className="flex items-center gap-3 mb-5">
              <button
                onClick={() =>
                  setPopup((p) => ({
                    ...p,
                    qty: String(Math.max(0.1, parseFloat(p.qty || 1) - 1)),
                  }))
                }
                className="w-11 h-11 rounded-xl bg-pink-100 hover:bg-pink-200 flex items-center justify-center text-pink-600 font-bold transition-colors"
              >
                <Minus className="w-5 h-5" />
              </button>
              <input
                type="number"
                min="0.01"
                step="0.01"
                max={popup.product.currentStock}
                value={popup.qty}
                onChange={(e) => setPopup((p) => ({ ...p, qty: e.target.value }))}
                className="flex-1 text-center text-2xl font-bold text-gray-800 border-2 border-pink-200 rounded-xl py-2 focus:outline-none focus:border-blue-400"
              />
              <button
                onClick={() =>
                  setPopup((p) => ({
                    ...p,
                    qty: String(Math.min(popup.product.currentStock, parseFloat(p.qty || 0) + 1)),
                  }))
                }
                className="w-11 h-11 rounded-xl bg-blue-100 hover:bg-blue-200 flex items-center justify-center text-blue-600 font-bold transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            {/* Subtotal preview */}
            <div className="bg-pink-50 rounded-xl p-3 mb-4 text-center">
              <p className="text-xs text-gray-500 mb-1">Subtotal</p>
              <p className="text-xl font-bold text-blue-600">
                {formatCurrency((parseFloat(popup.qty) || 0) * (popup.product.sellingPrice || popup.product.price || 0))}
              </p>
            </div>

            <button
              onClick={() => addToCart(popup.product, popup.qty)}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <ShoppingCart className="w-5 h-5" />
              Add to Cart
            </button>
          </div>
        </div>
      )}

      {/* ── CART PANEL (desktop sidebar / mobile drawer) ── */}
      {/* Mobile overlay */}
      {cartOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 z-40"
          onClick={() => setCartOpen(false)}
        />
      )}

      <div
        className={`
          fixed lg:static bottom-0 left-0 right-0 lg:bottom-auto
          z-40 lg:z-auto
          flex flex-col
          bg-white
          lg:w-96 lg:border-l lg:border-pink-100
          rounded-t-3xl lg:rounded-none
          shadow-2xl lg:shadow-none
          transition-transform duration-300 ease-out
          ${cartOpen ? 'translate-y-0' : 'translate-y-full lg:translate-y-0'}
          max-h-[85vh] lg:max-h-screen lg:h-full
        `}
      >
        {/* Cart Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-pink-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            {/* Drag handle on mobile */}
            <button onClick={() => setCartOpen(false)} className="lg:hidden mr-1">
              <ChevronUp className="w-5 h-5 text-gray-400" />
            </button>
            <ShoppingCart className="w-5 h-5 text-blue-500" />
            <h2 className="font-bold text-gray-800 text-lg">Cart</h2>
            {cart.length > 0 && (
              <span className="bg-blue-100 text-blue-600 text-xs font-bold px-2 py-0.5 rounded-full">
                {cart.length} item{cart.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          {cart.length > 0 && (
            <button
              onClick={clearCart}
              className="text-xs text-red-400 hover:text-red-600 font-medium flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear
            </button>
          )}
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-16 text-gray-300">
              <ShoppingCart className="w-16 h-16 mb-4 opacity-40" />
              <p className="text-sm font-medium text-gray-400">Your cart is empty</p>
              <p className="text-xs text-gray-300 mt-1">Tap a product to add it</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map((item) => (
                <div
                  key={item.productId}
                  className="bg-pink-50 rounded-2xl p-3 border border-pink-100"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 text-sm leading-tight truncate">
                        {item.productName}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {formatCurrency(item.unitPrice)} / {item.unit}
                      </p>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.productId)}
                      className="ml-2 text-red-300 hover:text-red-500 p-1 flex-shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQty(item.productId, Math.max(0.01, (item.quantity || 1) - 1))}
                        className="w-7 h-7 rounded-lg bg-white border border-pink-200 flex items-center justify-center text-pink-500 hover:bg-pink-100"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={item.quantity}
                        onChange={(e) => updateQty(item.productId, e.target.value)}
                        className="w-16 text-center text-sm font-bold text-gray-700 border border-pink-200 rounded-lg py-1 focus:outline-none focus:border-blue-400 bg-white"
                      />
                      <button
                        onClick={() => updateQty(item.productId, Math.min(item.maxStock, (item.quantity || 0) + 1))}
                        className="w-7 h-7 rounded-lg bg-white border border-pink-200 flex items-center justify-center text-blue-500 hover:bg-blue-100"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <p className="font-bold text-blue-600 text-sm">
                      {formatCurrency(item.subtotal)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cart Footer */}
        {cart.length > 0 && (
          <div className="px-4 pb-6 pt-3 border-t border-pink-100 flex-shrink-0 space-y-4">
            {/* Total */}
            <div className="bg-blue-50 rounded-2xl px-4 py-3 flex items-center justify-between">
              <span className="text-gray-600 font-semibold">Total</span>
              <span className="text-2xl font-extrabold text-blue-600">{formatCurrency(cartTotal)}</span>
            </div>

            {/* Payment method */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Payment Method</p>
              <div className="grid grid-cols-2 gap-2">
                {PAYMENT_METHODS.map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() => setPaymentMethod(value)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                      paymentMethod === value
                        ? 'border-blue-400 bg-blue-50 text-blue-600'
                        : 'border-pink-200 bg-white text-gray-500 hover:border-blue-200'
                    }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{label}</span>
                    {paymentMethod === value && (
                      <CheckCircle className="w-3.5 h-3.5 ml-auto flex-shrink-0 text-blue-500" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Complete Sale button */}
            <button
              onClick={completeSale}
              disabled={completing || cart.length === 0}
              className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl text-base transition-colors flex items-center justify-center gap-3 shadow-lg shadow-blue-200"
            >
              {completing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Complete Sale
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Receipt Modal */}
      {receiptData && (
        <ReceiptModal
          sale={receiptData}
          onClose={() => setReceiptData(null)}
        />
      )}
    </div>
  );
}
