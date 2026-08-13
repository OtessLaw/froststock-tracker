// Format Ghana currency
export const formatMoney = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) return 'GH₵0.00';
  return `GH₵${Number(amount).toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// Format date: 11 Aug 2026
export const formatDate = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

// Format date + time
export const formatDateTime = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Format stock quantity
export const formatQty = (qty, unit) => {
  const n = Number(qty);
  const formatted = n % 1 === 0 ? n.toString() : n.toFixed(2);
  return `${formatted}${unit === 'kg' || unit === 'g' ? unit : ' ' + unit}`;
};

// Get greeting based on time
export const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
};

// Payment method labels
export const paymentLabels = {
  cash: 'Cash',
  mobile_money: 'Mobile Money',
  bank: 'Bank',
  other: 'Other',
};

// Expense category labels
export const expenseCategoryLabels = {
  electricity: 'Electricity',
  transport: 'Transport',
  ice: 'Ice',
  packaging: 'Packaging',
  rent: 'Rent',
  repairs: 'Repairs',
  salaries: 'Salaries',
  other: 'Other',
};

// Stock status badge info
export const stockStatusInfo = {
  in_stock: { label: 'In Stock', class: 'badge-success' },
  low_stock: { label: 'Low Stock', class: 'badge-warning' },
  out_of_stock: { label: 'Out of Stock', class: 'badge-danger' },
};

// Debounce utility
export const debounce = (fn, delay) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};

// Truncate text
export const truncate = (str, n = 30) => {
  if (!str) return '';
  return str.length > n ? str.slice(0, n) + '…' : str;
};
