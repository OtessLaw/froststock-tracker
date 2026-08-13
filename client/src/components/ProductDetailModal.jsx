import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  X, PackagePlus, Edit2, Tag, Layers, DollarSign,
  TrendingUp, AlertTriangle, Clock, Users
} from 'lucide-react';
import API from '../services/api';
import { formatMoney, formatDateTime, stockStatusInfo } from '../utils/helpers';

// ─── Info Row ─────────────────────────────────────────────────────────────────
function InfoRow({ icon: Icon, label, value, valueClass = '' }) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-gray-50 last:border-0">
      <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-blue-400" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-400 font-medium">{label}</p>
        <p className={`text-sm font-semibold text-slate-700 mt-0.5 ${valueClass}`}>{value}</p>
      </div>
    </div>
  );
}

// ─── Stock History Item ────────────────────────────────────────────────────────
function HistoryItem({ entry }) {
  const isIn = entry.type === 'in' || entry.quantity > 0;
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-slate-600 truncate">
          {entry.reason || entry.type || 'Stock update'}
        </p>
        <p className="text-xs text-gray-400">{formatDateTime(entry.createdAt)}</p>
      </div>
      <span className={`text-sm font-bold ml-3 tabular-nums ${isIn ? 'text-green-600' : 'text-red-500'}`}>
        {isIn ? '+' : ''}{entry.quantity} {entry.unit}
      </span>
    </div>
  );
}

export default function ProductDetailModal({ product, onClose, onEdit }) {
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  useEffect(() => {
    if (!product?._id) return;
    let cancelled = false;
    API.get('/stock/history', { params: { productId: product._id } })
      .then((res) => {
        if (!cancelled) {
          const raw = res.data?.data || res.data?.history || res.data;
          const items = Array.isArray(raw) ? raw : [];
          setHistory(items.slice(0, 5));
        }
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setHistoryLoading(false); });
    return () => { cancelled = true; };
  }, [product._id]);

  const statusInfo = stockStatusInfo[product.stockStatus] || { label: product.stockStatus, class: 'badge-blue' };

  const margin =
    product.buyingPrice > 0
      ? (((product.sellingPrice - product.buyingPrice) / product.buyingPrice) * 100).toFixed(1)
      : '—';

  const inventoryValue = (product.currentStock ?? 0) * (product.buyingPrice ?? 0);

  // Trap scroll on body
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-content">
        {/* Header */}
        <div className="modal-header">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-slate-800 truncate">{product.name}</h2>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="badge-pink">{product.category?.name || product.category}</span>
              <span className={statusInfo.class}>{statusInfo.label}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors ml-2 flex-shrink-0"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5">
          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-blue-50 rounded-2xl p-3 text-center">
              <p className="text-xs text-blue-400 font-medium">Current Stock</p>
              <p className="text-lg font-extrabold text-blue-600 mt-0.5 tabular-nums">
                {product.currentStock ?? 0}
              </p>
              <p className="text-xs text-blue-400">{product.unit}</p>
            </div>
            <div className="bg-amber-50 rounded-2xl p-3 text-center">
              <p className="text-xs text-amber-500 font-medium">Min Level</p>
              <p className="text-lg font-extrabold text-amber-600 mt-0.5 tabular-nums">
                {product.minimumStock ?? 0}
              </p>
              <p className="text-xs text-amber-400">{product.unit}</p>
            </div>
            <div className="bg-green-50 rounded-2xl p-3 text-center">
              <p className="text-xs text-green-500 font-medium">Margin</p>
              <p className="text-lg font-extrabold text-green-600 mt-0.5 tabular-nums">
                {margin}%
              </p>
            </div>
          </div>

          {/* Details */}
          <div className="card p-3">
            <InfoRow icon={Tag} label="Category" value={product.category?.name || product.category || '—'} />
            <InfoRow icon={Layers} label="Unit" value={product.unit || '—'} />
            <InfoRow icon={DollarSign} label="Buying Price" value={formatMoney(product.buyingPrice)} />
            <InfoRow icon={DollarSign} label="Selling Price" value={formatMoney(product.sellingPrice)} valueClass="text-blue-600" />
            <InfoRow icon={TrendingUp} label="Inventory Value" value={formatMoney(inventoryValue)} valueClass="text-green-600" />
            <InfoRow icon={Users} label="Supplier" value={product.supplier?.name || product.supplier || 'Not specified'} />
            {product.description && (
              <InfoRow icon={Layers} label="Description" value={product.description} />
            )}
          </div>

          {/* Stock History */}
          <div>
            <h3 className="section-title mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-500" /> Stock History
            </h3>
            <div className="card p-3">
              {historyLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-10 bg-pink-50 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : history.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No stock history yet</p>
              ) : (
                history.map((entry, i) => <HistoryItem key={entry._id || i} entry={entry} />)
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-white border-t border-gray-100 p-4 flex gap-3">
          {onEdit && (
            <button
              onClick={onEdit}
              className="btn-secondary flex-1"
            >
              <Edit2 className="w-4 h-4" />
              Edit
            </button>
          )}
          <Link
            to={`/stock/add?productId=${product._id}`}
            onClick={onClose}
            className="btn-primary flex-1"
          >
            <PackagePlus className="w-4 h-4" />
            Add Stock
          </Link>
          <button onClick={onClose} className="btn-outline flex-1">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
