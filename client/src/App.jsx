import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, AdminRoute, PublicRoute } from './components/ProtectedRoute';

// Lazy load pages for performance
const LoginPage = lazy(() => import('./pages/LoginPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const ProductsPage = lazy(() => import('./pages/ProductsPage'));
const SalesPage = lazy(() => import('./pages/SalesPage'));
const SalesHistoryPage = lazy(() => import('./pages/SalesHistoryPage'));
const StockPage = lazy(() => import('./pages/StockPage'));
const InventoryPage = lazy(() => import('./pages/InventoryPage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));
const SuppliersPage = lazy(() => import('./pages/SuppliersPage'));
const ExpensesPage = lazy(() => import('./pages/ExpensesPage'));
const UsersPage = lazy(() => import('./pages/UsersPage'));

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('Page Error Boundary caught an error:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-pink-50 text-center">
          <div className="max-w-md bg-white p-8 rounded-3xl shadow-xl border border-pink-100">
            <div className="w-14 h-14 bg-red-100 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4 font-bold text-2xl">
              ⚠️
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Something went wrong</h2>
            <p className="text-sm text-gray-500 mb-6">
              {this.state.error?.message || 'The page encountered an unexpected error.'}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="btn-primary w-full py-3"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const PageLoader = () => (
  <div className="flex items-center justify-center h-64">
    <div className="w-8 h-8 spinner border-[3px]"></div>
  </div>
);

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Toaster
            position="top-center"
            gutter={8}
            toastOptions={{
              duration: 3500,
              style: {
                background: '#fff',
                color: '#1e293b',
                fontFamily: 'Inter, sans-serif',
                fontSize: '14px',
                fontWeight: 500,
                borderRadius: '12px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                padding: '12px 16px',
                maxWidth: '400px',
              },
              success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
              error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
            }}
          />

          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public routes */}
              <Route element={<PublicRoute />}>
                <Route path="/login" element={<LoginPage />} />
              </Route>

              {/* Protected routes (all authenticated users) */}
              <Route element={<ProtectedRoute />}>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/products" element={<ProductsPage />} />
                <Route path="/sales/new" element={<SalesPage />} />
                <Route path="/sales" element={<SalesHistoryPage />} />
                <Route path="/stock" element={<StockPage />} />
                <Route path="/inventory" element={<InventoryPage />} />
                <Route path="/reports" element={<ReportsPage />} />
                <Route path="/expenses" element={<ExpensesPage />} />
              </Route>

              {/* Admin-only routes */}
              <Route element={<AdminRoute />}>
                <Route path="/suppliers" element={<SuppliersPage />} />
                <Route path="/users" element={<UsersPage />} />
              </Route>

              {/* Catch-all */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
