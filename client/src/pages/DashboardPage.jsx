import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingCart, PackagePlus, Package, BarChart2,
  TrendingUp, AlertTriangle, Clock, Loader2
} from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import API from '../services/api';
import { formatMoney, formatDateTime, getGreeting, stockStatusInfo } from '../utils/helpers';

// ─── Skeleton ────────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="stat-card animate-pulse">
      <div className="h-3 w-20 bg-pink-100 rounded mb-3" />
      <div className="h-7 w-32 bg-pink-100 rounded" />
    </div>
  );
}

function SkeletonBlock({ h = 'h-48' }) {
  return <div className={`card animate-pulse ${h} bg-pink-50`} />;
}

// ─── Custom Tooltip for chart ─────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-pink-100 rounded-xl shadow-lg p-3 text-sm">
      <p className="font-semibold text-slate-600 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color }} className="font-medium">
          {p.name}: {formatMoney(p.value)}
        </p>
      ))}
    </div>
  );
}

// ─── Quick Action Button ──────────────────────────────────────────────────────
function QuickAction({ to, icon: Icon, label, colorClass, bgClass }) {
  return (
    <Link
      to={to}
      className={`flex flex-col items-center justify-center gap-2 rounded-2xl p-4 font-semibold text-sm transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm hover:shadow-md ${bgClass} ${colorClass}`}
      style={{ minHeight: '90px' }}
    >
      <Icon className="w-7 h-7" />
      <span>{label}</span>
    </Link>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, isMoney = false, colorClass = 'text-slate-800' }) {
  return (
    <div className="stat-card">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
      <p className={`text-xl font-extrabold mt-1 ${colorClass} tabular-nums`}>
        {isMoney ? formatMoney(value ?? 0) : (value ?? 0)}
      </p>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const fetchDashboard = async () => {
      try {
        const res = await API.get('/reports/dashboard');
        const payload = res.data?.data || res.data || {};
        if (!cancelled) setData(payload);
      } catch (err) {
        if (!cancelled) {
          setError(err?.response?.data?.message || 'Failed to load dashboard data.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchDashboard();
    return () => { cancelled = true; };
  }, []);

  const greeting = getGreeting();
  const firstName = user?.name?.split(' ')[0] || user?.name || 'there';

  if (error) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <p className="text-red-500 font-semibold">{error}</p>
        <button className="btn-primary mt-4" onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 max-w-5xl mx-auto pb-24 sm:pb-8">
      {/* Greeting */}
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-slate-800">
          {greeting} 👋
        </h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Welcome back, <span className="font-semibold text-blue-500">{firstName}</span>
        </p>
      </div>

      {/* Stat Cards — 2×2 grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {loading ? (
          <>
            <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
          </>
        ) : (
          <>
            <StatCard label="Today's Sales" value={data?.today?.revenue ?? 0} isMoney colorClass="text-blue-600" />
            <StatCard label="Today's Profit" value={data?.today?.profit ?? 0} isMoney colorClass="text-green-600" />
            <StatCard label="Items Sold" value={data?.today?.itemsSold ?? 0} colorClass="text-purple-600" />
            <StatCard label="Low Stock" value={data?.lowStockCount ?? 0} colorClass="text-amber-600" />
          </>
        )}
      </div>

      {/* Quick Actions */}
      <div className="mb-6">
        <h2 className="section-title mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <QuickAction to="/sales/new" icon={ShoppingCart} label="NEW SALE"
            bgClass="bg-blue-500 hover:bg-blue-600" colorClass="text-white" />
          <QuickAction to="/stock/add" icon={PackagePlus} label="ADD STOCK"
            bgClass="bg-green-500 hover:bg-green-600" colorClass="text-white" />
          <QuickAction to="/stock" icon={Package} label="VIEW STOCK"
            bgClass="bg-purple-500 hover:bg-purple-600" colorClass="text-white" />
          <QuickAction to="/reports" icon={BarChart2} label="REPORTS"
            bgClass="bg-amber-500 hover:bg-amber-600" colorClass="text-white" />
        </div>
      </div>

      {/* Sales Overview Chart */}
      <div className="card mb-6">
        <div className="section-header">
          <h2 className="section-title">Sales Overview</h2>
          <span className="text-xs text-gray-400">Last 7 days</span>
        </div>
        {loading ? (
          <div className="h-48 bg-pink-50 rounded-xl animate-pulse" />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data?.salesChart || []} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#fce7f3" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false}
                tickFormatter={(v) => `₵${(v / 1000).toFixed(0)}k`} width={42} />
              <Tooltip content={<ChartTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="revenue" name="Revenue" fill="#3b82f6" radius={[6, 6, 0, 0]} maxBarSize={40} />
              <Line dataKey="profit" name="Profit" stroke="#f472b6" strokeWidth={2.5}
                dot={{ r: 3, fill: '#f472b6' }} type="monotone" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Bottom 3-col layout on desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {/* Top Selling Products */}
        <div className="card sm:col-span-1">
          <h2 className="section-title mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-500" /> Top Products
          </h2>
          {loading ? (
            <SkeletonBlock h="h-40" />
          ) : !data?.topProducts?.length ? (
            <p className="text-sm text-gray-400 text-center py-8">No data yet</p>
          ) : (
            <ul className="space-y-2">
              {data.topProducts.slice(0, 5).map((p, i) => (
                <li key={p._id || i} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-xs font-bold flex items-center justify-center flex-shrink-0">
                      {i + 1}
                    </span>
                    <span className="text-sm text-slate-700 font-medium truncate">{p.name}</span>
                  </div>
                  <span className="text-sm font-bold text-slate-800 tabular-nums whitespace-nowrap">
                    {formatMoney(p.revenue)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Low Stock Alerts */}
        <div className="card sm:col-span-1">
          <h2 className="section-title mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" /> Low Stock
          </h2>
          {loading ? (
            <SkeletonBlock h="h-40" />
          ) : !data?.lowStockItems?.length ? (
            <p className="text-sm text-gray-400 text-center py-8">All stock levels OK</p>
          ) : (
            <ul className="space-y-2">
              {data.lowStockItems.slice(0, 5).map((item, i) => (
                <li key={item._id || i} className="flex items-center justify-between gap-2">
                  <span className="text-sm text-slate-700 font-medium truncate">
                    ⚠️ {item.name}
                  </span>
                  <span className="text-xs text-amber-600 font-semibold whitespace-nowrap">
                    {item.currentStock}/{item.minimumStock} {item.unit}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recent Sales */}
        <div className="card sm:col-span-1">
          <h2 className="section-title mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-purple-500" /> Recent Sales
          </h2>
          {loading ? (
            <SkeletonBlock h="h-40" />
          ) : !data?.recentSales?.length ? (
            <p className="text-sm text-gray-400 text-center py-8">No sales recorded yet</p>
          ) : (
            <ul className="space-y-2">
              {data.recentSales.slice(0, 5).map((sale, i) => (
                <li key={sale._id || i} className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-700">
                      #{sale.saleNumber || sale._id?.slice(-6)}
                    </p>
                    <p className="text-xs text-gray-400">
                      {sale.paymentMethod?.replace('_', ' ')} · {formatDateTime(sale.createdAt)}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-slate-800 tabular-nums whitespace-nowrap">
                    {formatMoney(sale.total)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
