import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingCart, Package, BarChart2, Users,
  Truck, DollarSign, Archive, Menu, X, LogOut, ChevronRight,
  Snowflake, Settings,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { to: '/sales/new', icon: ShoppingCart, label: 'New Sale' },
  { to: '/sales', icon: Archive, label: 'Sales History' },
  { to: '/stock', icon: Package, label: 'Stock' },
  { to: '/inventory', icon: Package, label: 'Inventory' },
  { to: '/products', icon: Archive, label: 'Products', adminOnly: false },
  { to: '/reports', icon: BarChart2, label: 'Reports' },
  { to: '/expenses', icon: DollarSign, label: 'Expenses' },
  { to: '/suppliers', icon: Truck, label: 'Suppliers', adminOnly: true },
  { to: '/users', icon: Users, label: 'Users', adminOnly: true },
];

// Bottom nav items (mobile)
const bottomNavItems = [
  { to: '/', icon: LayoutDashboard, label: 'Home', exact: true },
  { to: '/sales/new', icon: ShoppingCart, label: 'Sell', highlight: true },
  { to: '/stock', icon: Package, label: 'Stock' },
  { to: '/reports', icon: BarChart2, label: 'Reports' },
];

const Sidebar = ({ open, onClose, isAdmin }) => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully.');
    navigate('/login');
  };

  return (
    <>
      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-white shadow-2xl z-50 flex flex-col
          transform transition-transform duration-300 ease-in-out
          ${open ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:shadow-sm lg:border-r lg:border-pink-100`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-pink-100">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-sm">
            <Snowflake className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="font-bold text-navy-800 text-base leading-tight">FrostStock</p>
            <p className="text-xs text-gray-500">Tracker</p>
          </div>
          <button
            onClick={onClose}
            className="ml-auto p-1 rounded-lg hover:bg-gray-100 lg:hidden"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          {navItems
            .filter(item => !item.adminOnly || isAdmin)
            .map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.exact}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium mb-0.5 transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-600 hover:bg-pink-50 hover:text-pink-600'
                  }`
                }
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {item.label}
              </NavLink>
            ))}
        </nav>

        {/* User info + logout */}
        <div className="p-4 border-t border-pink-100">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-9 h-9 bg-gradient-to-br from-pink-400 to-pink-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">{user?.name?.[0]?.toUpperCase()}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-navy-800 truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
};

const MainLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isAdmin } = useAuth();

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-brand">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} isAdmin={isAdmin} />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-pink-100 px-4 py-3 flex items-center gap-3 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-xl hover:bg-pink-50 transition-colors"
          >
            <Menu className="w-5 h-5 text-navy-700" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Snowflake className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-navy-800">FrostStock</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto pb-20 lg:pb-0">
          <div className="max-w-7xl mx-auto px-4 py-5 lg:px-6 lg:py-6">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-pink-100 flex lg:hidden z-30 pb-safe">
        {bottomNavItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.exact}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-xs font-medium transition-all duration-200 ${
                item.highlight
                  ? isActive
                    ? 'text-blue-600'
                    : 'text-blue-500'
                  : isActive
                  ? 'text-blue-600'
                  : 'text-gray-500'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div
                  className={`p-2 rounded-xl transition-all duration-200 ${
                    item.highlight
                      ? isActive
                        ? 'bg-blue-100'
                        : 'bg-blue-500'
                      : isActive
                      ? 'bg-blue-50'
                      : 'bg-transparent'
                  }`}
                >
                  <item.icon
                    className={`w-5 h-5 ${
                      item.highlight && !isActive ? 'text-white' : ''
                    }`}
                  />
                </div>
                <span>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

export default MainLayout;
