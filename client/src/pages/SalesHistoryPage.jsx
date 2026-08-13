import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  Search, Calendar, Filter, ChevronLeft, ChevronRight,
  ReceiptText, Loader2, TrendingUp, CreditCard, Smartphone,
  Building2, MoreHorizontal, User, Package, ChevronDown
} from 'lucide-react';
import SaleDetailModal from '../components/SaleDetailModal';
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

const formatDateShort = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-GH', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
};

const padSaleNumber = (id) => {
  const num = String(id || '').replace(/\D/g, '');
  return num ? `FS${num.padStart(5, '0')}` : String(id);
};

const PAYMENT_FILTERS = [
  { value: '', label: 'All Payments' },
  { value: 'cash', label: 'Cash' },
  { value: 'mobile_money', label: 'Mobile Money' },
  { value: 'bank', label: 'Bank' },
  { value: 'other', label: 'Other' },
];

const PAYMENT_ICONS = {
  cash: CreditCard,
  mobile_money: Smartphone,
  bank: Building2,
  other: MoreHorizontal,
};

const PAYMENT_LABELS = {
  cash: 'Cash',
  mobile_money: 'Mobile Money',
  bank: 'Bank',
  other: 'Other',
};

const PAGE_SIZE = 15;

export default function SalesHistoryPage() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);

  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const [selectedSale, setSelectedSale] = useState(null);

  const fetchSales = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: PAGE_SIZE,
        ...(search && { search }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
        ...(paymentFilter && { paymentMethod: paymentFilter }),
      };
      const res = await API.get('/sales', { params });
      const data = res.data?.data || res.data;
      const list = Array.isArray(data?.sales)
        ? data.sales
        : Array.isArray(data?.docs)
        ? data.docs
        : Array.isArray(data)
        ? data
        : [];
      const count = data?.total || data?.totalDocs || list.length;
      setSales(list);
      setTotalCount(count);
    } catch {
      toast.error('Failed to load sales history');
    } finally {
      setLoading(false);
    }
  }, [page, search, startDate, endDate, paymentFilter]);

  useEffect(() => {
    setPage(1);
  }, [search, startDate, endDate, paymentFilter]);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const clearFilters = () => {
    setSearch('');
    setStartDate('');
    setEndDate('');
    setPaymentFilter('');
    setPage(1);
  };

  const hasFilters = search || startDate || endDate || paymentFilter;

  return (
    <div className="min-h-screen bg-pink-50">
      {/* Header */}
      <div className="bg-white border-b border-pink-100 shadow-sm sticky top-0 z-10">
        <div className="px-4 py-4 max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-xl font-bold text-gray-800">Sales History</h1>
              <p className="text-xs text-gray-400 mt-0.5">{totalCount} total sales</p>
            </div>
            <button
              onClick={() => setShowFilters((s) => !s)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
                showFilters || hasFilters
                  ? 'bg-blue-50 border-blue-300 text-blue-600'
                  : 'bg-pink-50 border-pink-200 text-gray-600 hover:bg-pink-100'
              }`}
            >
              <Filter className="w-4 h-4" />
              Filters
              {hasFilters && (
                <span className="bg-blue-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">!</span>
              )}
            </button>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by sale number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-pink-200 bg-pink-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
            />
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="space-y-3 pt-2 pb-1 border-t border-pink-100">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">
                    <Calendar className="w-3 h-3 inline mr-1" />Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full border border-pink-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">
                    <Calendar className="w-3 h-3 inline mr-1" />End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full border border-pink-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
              </div>

              {/* Payment filter chips */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">
                  Payment Method
                </label>
                <div className="flex flex-wrap gap-2">
                  {PAYMENT_FILTERS.map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => setPaymentFilter(value)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                        paymentFilter === value
                          ? 'bg-blue-500 text-white shadow-sm'
                          : 'bg-pink-100 text-gray-600 hover:bg-pink-200'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {hasFilters && (
                <button
                  onClick={clearFilters}
                  className="text-xs text-red-400 hover:text-red-600 font-medium"
                >
                  Clear all filters
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-4 max-w-6xl mx-auto">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
          </div>
        ) : sales.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400">
            <ReceiptText className="w-16 h-16 mb-4 opacity-40" />
            <p className="text-base font-medium text-gray-500">No sales found</p>
            {hasFilters && (
              <button onClick={clearFilters} className="mt-3 text-sm text-blue-500 underline">
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-pink-100 overflow-hidden">
              <table className="w-full">
                <thead className="bg-pink-50 border-b border-pink-100">
                  <tr>
                    {['Sale #', 'Date', 'Items', 'Total', 'Profit', 'Payment', 'Staff'].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-pink-50">
                  {sales.map((sale) => {
                    const PayIcon = PAYMENT_ICONS[sale.paymentMethod] || CreditCard;
                    const saleNum = sale.saleNumber || sale.receiptNumber || padSaleNumber(sale._id?.slice(-5));
                    return (
                      <tr
                        key={sale._id || sale.id}
                        onClick={() => setSelectedSale(sale)}
                        className="hover:bg-blue-50 cursor-pointer transition-colors group"
                      >
                        <td className="px-4 py-3">
                          <span className="font-bold text-blue-600 text-sm">{saleNum}</span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{formatDate(sale.createdAt || sale.date)}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 text-sm text-gray-600">
                            <Package className="w-3.5 h-3.5 text-gray-400" />
                            {sale.items?.length || sale.itemCount || 0}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-bold text-gray-800 text-sm">{formatCurrency(sale.total || sale.totalAmount)}</td>
                        <td className="px-4 py-3">
                          <span className="text-green-600 font-semibold text-sm flex items-center gap-1">
                            <TrendingUp className="w-3.5 h-3.5" />
                            {formatCurrency(sale.profit || sale.grossProfit || 0)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-medium">
                            <PayIcon className="w-3 h-3" />
                            {PAYMENT_LABELS[sale.paymentMethod] || sale.paymentMethod || 'Cash'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 text-sm text-gray-500">
                            <User className="w-3.5 h-3.5" />
                            {sale.staff?.name || sale.staffName || sale.createdBy?.name || '—'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List */}
            <div className="md:hidden space-y-3">
              {sales.map((sale) => {
                const PayIcon = PAYMENT_ICONS[sale.paymentMethod] || CreditCard;
                const saleNum = sale.saleNumber || sale.receiptNumber || padSaleNumber(sale._id?.slice(-5));
                return (
                  <button
                    key={sale._id || sale.id}
                    onClick={() => setSelectedSale(sale)}
                    className="w-full text-left bg-white rounded-2xl p-4 border border-pink-100 shadow-sm hover:shadow-md transition-shadow active:scale-[0.99]"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-bold text-blue-600">{saleNum}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{formatDate(sale.createdAt || sale.date)}</p>
                      </div>
                      <p className="text-lg font-extrabold text-gray-800">{formatCurrency(sale.total || sale.totalAmount)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-pink-50 text-gray-500 text-xs">
                        <Package className="w-3 h-3" />
                        {sale.items?.length || sale.itemCount || 0} items
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-medium">
                        <PayIcon className="w-3 h-3" />
                        {PAYMENT_LABELS[sale.paymentMethod] || 'Cash'}
                      </span>
                      {(sale.profit || sale.grossProfit) > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-50 text-green-600 text-xs font-medium ml-auto">
                          <TrendingUp className="w-3 h-3" />
                          {formatCurrency(sale.profit || sale.grossProfit)}
                        </span>
                      )}
                    </div>
                    {(sale.staff?.name || sale.staffName || sale.createdBy?.name) && (
                      <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {sale.staff?.name || sale.staffName || sale.createdBy?.name}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between bg-white rounded-2xl border border-pink-100 px-4 py-3 shadow-sm">
                <p className="text-sm text-gray-500">
                  Page <strong>{page}</strong> of <strong>{totalPages}</strong>
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="p-2 rounded-xl border border-pink-200 text-gray-500 hover:bg-pink-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {/* Page numbers */}
                  <div className="flex gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (page <= 3) {
                        pageNum = i + 1;
                      } else if (page >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = page - 2 + i;
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setPage(pageNum)}
                          className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                            page === pageNum
                              ? 'bg-blue-500 text-white'
                              : 'text-gray-600 hover:bg-pink-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="p-2 rounded-xl border border-pink-200 text-gray-500 hover:bg-pink-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Sale Detail Modal */}
      {selectedSale && (
        <SaleDetailModal
          sale={selectedSale}
          onClose={() => setSelectedSale(null)}
        />
      )}
    </div>
  );
}
