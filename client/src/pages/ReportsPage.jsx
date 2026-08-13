import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp, TrendingDown, ShoppingCart, DollarSign, Download,
  BarChart2, Package, Receipt, AlertCircle, ChevronUp, ChevronDown,
} from 'lucide-react';
import toast from 'react-hot-toast';
import API from '../services/api';
import { formatMoney, formatDate } from '../utils/helpers';

// ── Custom tooltip for recharts ─────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-pink-100 rounded-xl shadow-lg p-3 text-sm">
      <p className="font-semibold text-navy-800 mb-1">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} style={{ color: entry.color }}>
          {entry.name}: {formatMoney(entry.value)}
        </p>
      ))}
    </div>
  );
};

// ── Skeleton loader ─────────────────────────────────────────────────────────
const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse bg-pink-100 rounded-xl ${className}`} />
);

const SummarySkeleton = () => (
  <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="card">
        <Skeleton className="h-4 w-24 mb-2" />
        <Skeleton className="h-7 w-32" />
      </div>
    ))}
  </div>
);

// ── Period tabs ─────────────────────────────────────────────────────────────
const PERIODS = [
  { value: 'today', label: 'Today' },
  { value: 'week',  label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'custom', label: 'Custom' },
];

// ── Summary card ────────────────────────────────────────────────────────────
const SummaryCard = ({ label, value, icon: Icon, color, isMoney = true, delta }) => (
  <div className="stat-card">
    <div className="flex items-center justify-between mb-2">
      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</span>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
        <Icon size={16} className="text-white" />
      </div>
    </div>
    <p className="text-xl font-bold text-navy-800 text-money">
      {isMoney ? formatMoney(value) : (value ?? 0).toLocaleString()}
    </p>
    {delta !== undefined && (
      <p className={`text-xs mt-1 flex items-center gap-1 ${delta >= 0 ? 'text-green-600' : 'text-red-500'}`}>
        {delta >= 0 ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        {Math.abs(delta).toFixed(1)}% vs last period
      </p>
    )}
  </div>
);

// ── CSV export helper ───────────────────────────────────────────────────────
const exportCSV = (sales, period) => {
  if (!sales?.length) {
    toast.error('No sales data to export');
    return;
  }
  const headers = ['Date', 'Product', 'Qty Sold', 'Unit Price (GH₵)', 'Revenue (GH₵)', 'Cost (GH₵)', 'Profit (GH₵)', 'Payment Method'];
  const rows = sales.map((s) => [
    formatDate(s.date || s.createdAt),
    s.productName || s.product?.name || '',
    s.qtySold ?? s.quantity ?? '',
    s.unitPrice ?? '',
    s.revenue ?? s.totalAmount ?? '',
    s.cost ?? '',
    s.profit ?? '',
    s.paymentMethod || '',
  ]);
  const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `sales_report_${period}_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  toast.success('CSV exported!');
};

// ── Expense category icon color map ────────────────────────────────────────
const expenseColors = {
  electricity: 'bg-yellow-100 text-yellow-700',
  transport:   'bg-blue-100 text-blue-700',
  ice:         'bg-cyan-100 text-cyan-700',
  packaging:   'bg-purple-100 text-purple-700',
  rent:        'bg-pink-100 text-pink-700',
  repairs:     'bg-orange-100 text-orange-700',
  salaries:    'bg-green-100 text-green-700',
  other:       'bg-gray-100 text-gray-600',
};

// ── Main component ──────────────────────────────────────────────────────────
export default function ReportsPage() {
  const [period, setPeriod]         = useState('week');
  const [startDate, setStartDate]   = useState('');
  const [endDate, setEndDate]       = useState('');
  const [data, setData]             = useState(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { period };
      if (period === 'custom') {
        if (!startDate || !endDate) { setLoading(false); return; }
        params.startDate = startDate;
        params.endDate   = endDate;
      }
      const res = await API.get('/reports/sales', { params });
      const payload = res.data?.data || res.data || {};
      setData(payload);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to load report';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [period, startDate, endDate]);

  useEffect(() => {
    if (period !== 'custom' || (startDate && endDate)) {
      fetchReport();
    }
  }, [fetchReport, period, startDate, endDate]);

  const summary     = data?.summary   || {};
  const chartData   = data?.dailyChart || data?.chartData || [];
  const topProducts = data?.topProducts || [];
  const expenses    = data?.expenses  || [];
  const salesRaw    = data?.sales     || [];

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Page header */}
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <BarChart2 size={24} className="text-blue-500" /> Reports
          </h1>
          <p className="page-subtitle">Sales, profit &amp; expense analytics</p>
        </div>
        <button
          className="btn-outline text-sm self-start sm:self-auto"
          onClick={() => exportCSV(salesRaw, period)}
        >
          <Download size={16} /> Export CSV
        </button>
      </div>

      {/* Period selector */}
      <div className="card mb-6 p-3">
        <div className="flex flex-wrap gap-2 mb-3">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                period === p.value
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'bg-pink-50 text-pink-700 hover:bg-pink-100'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        {period === 'custom' && (
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <label className="label">Start Date</label>
              <input
                type="date"
                className="input-field"
                value={startDate}
                max={endDate || undefined}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <label className="label">End Date</label>
              <input
                type="date"
                className="input-field"
                value={endDate}
                min={startDate || undefined}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        )}
      </div>

      {/* Error state */}
      {error && !loading && (
        <div className="card mb-6 flex items-center gap-3 border-red-200 bg-red-50">
          <AlertCircle size={20} className="text-red-500 shrink-0" />
          <div>
            <p className="font-semibold text-red-700">Failed to load report</p>
            <p className="text-sm text-red-500">{error}</p>
          </div>
          <button className="ml-auto btn-secondary text-sm" onClick={fetchReport}>Retry</button>
        </div>
      )}

      {/* Summary cards */}
      {loading ? (
        <SummarySkeleton />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <SummaryCard label="Total Sales Revenue"  value={summary.totalRevenue}  icon={TrendingUp}    color="bg-blue-500" />
          <SummaryCard label="Gross Profit"          value={summary.grossProfit}   icon={DollarSign}    color="bg-green-500" />
          <SummaryCard label="Total Expenses"        value={summary.totalExpenses} icon={TrendingDown}  color="bg-orange-500" />
          <SummaryCard label="Net Profit"            value={summary.netProfit}     icon={TrendingUp}    color={Number(summary.netProfit) >= 0 ? 'bg-emerald-500' : 'bg-red-500'} />
          <SummaryCard label="Sales Count"           value={summary.salesCount}    icon={ShoppingCart}  color="bg-pink-500" isMoney={false} />
        </div>
      )}

      {/* Sales Chart */}
      <div className="card mb-6">
        <h2 className="section-title mb-4">Daily Revenue &amp; Profit</h2>
        {loading ? (
          <Skeleton className="h-56 w-full" />
        ) : chartData.length === 0 ? (
          <div className="empty-state py-10">
            <BarChart2 size={40} className="text-pink-200 mb-3" />
            <p className="text-gray-400 text-sm">No chart data for this period</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#fce7f3" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(v) => `₵${(v / 1000).toFixed(1)}k`} tick={{ fontSize: 11 }} width={55} />
              <Tooltip content={<ChartTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="revenue" name="Revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="profit"  name="Profit"  fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Top Selling Products */}
      <div className="card mb-6">
        <h2 className="section-title mb-4 flex items-center gap-2">
          <Package size={18} className="text-blue-400" /> Top Selling Products
        </h2>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : topProducts.length === 0 ? (
          <div className="empty-state py-8">
            <Package size={36} className="text-pink-200 mb-2" />
            <p className="text-gray-400 text-sm">No sales for this period</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Product</th>
                  <th>Category</th>
                  <th className="text-right">Qty Sold</th>
                  <th className="text-right">Revenue</th>
                  <th className="text-right">Profit</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((p, idx) => (
                  <tr key={p._id || idx}>
                    <td>
                      <span className={`w-6 h-6 inline-flex items-center justify-center rounded-full text-xs font-bold
                        ${idx === 0 ? 'bg-yellow-100 text-yellow-700' : idx === 1 ? 'bg-gray-100 text-gray-600' : idx === 2 ? 'bg-orange-100 text-orange-600' : 'bg-pink-50 text-pink-500'}`}>
                        {idx + 1}
                      </span>
                    </td>
                    <td className="font-medium text-navy-800">{p.productName || p.name}</td>
                    <td>
                      <span className="badge-blue">{p.category || '—'}</span>
                    </td>
                    <td className="text-right font-semibold">{(p.qtySold ?? p.totalQty ?? 0).toLocaleString()}</td>
                    <td className="text-right text-money">{formatMoney(p.revenue ?? p.totalRevenue)}</td>
                    <td className={`text-right font-semibold ${Number(p.profit ?? p.totalProfit) >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {formatMoney(p.profit ?? p.totalProfit)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Expenses list */}
      <div className="card">
        <h2 className="section-title mb-4 flex items-center gap-2">
          <Receipt size={18} className="text-orange-400" /> Expenses for Period
        </h2>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
          </div>
        ) : expenses.length === 0 ? (
          <div className="empty-state py-8">
            <Receipt size={36} className="text-pink-200 mb-2" />
            <p className="text-gray-400 text-sm">No expenses recorded for this period</p>
          </div>
        ) : (
          <div className="space-y-3">
            {expenses.map((exp) => (
              <div key={exp._id} className="flex items-center gap-4 p-3 rounded-xl bg-gray-50 border border-gray-100">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold ${expenseColors[exp.category] || expenseColors.other}`}>
                  {(exp.category || 'O')[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-navy-800 text-sm truncate">{exp.description || exp.category}</p>
                  <p className="text-xs text-gray-500">{formatDate(exp.date)} · {exp.paymentMethod || '—'}</p>
                </div>
                <p className="font-bold text-orange-600 text-sm whitespace-nowrap">{formatMoney(exp.amount)}</p>
              </div>
            ))}
            <div className="flex justify-end pt-2 border-t border-gray-100">
              <p className="text-sm font-bold text-navy-800">
                Total: <span className="text-orange-600">{formatMoney(summary.totalExpenses)}</span>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
