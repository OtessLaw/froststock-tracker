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

// Default product image mappings for cold store inventory
export const getProductImage = (product) => {
  if (product && product.image && product.image.trim() !== '') {
    return product.image;
  }

  const name = (product?.name || '').toLowerCase();
  const cat = typeof product?.category === 'object' ? (product.category?.name || '').toLowerCase() : '';

  if (name.includes('sausage')) return 'https://images.unsplash.com/photo-1529042410759-befb1204b468?auto=format&fit=crop&w=600&q=80';
  if (name.includes('tilapia')) return 'https://images.unsplash.com/photo-1534483509719-3feaee7c30da?auto=format&fit=crop&w=600&q=80';
  if (name.includes('kpanla') || name.includes('mackerel')) return 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=600&q=80';
  if (name.includes('red fish') || name.includes('snapper')) return 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=80';
  if (name.includes('hake')) return 'https://images.unsplash.com/photo-1498654896293-37aacf113fd9?auto=format&fit=crop&w=600&q=80';
  if (name.includes('salmon')) return 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=600&q=80';
  if (name.includes('tuna')) return 'https://images.unsplash.com/photo-1501595091296-3aa970afb3ff?auto=format&fit=crop&w=600&q=80';
  
  if (name.includes('goat')) return 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?auto=format&fit=crop&w=600&q=80';
  if (name.includes('beef') || name.includes('cow')) return 'https://images.unsplash.com/photo-1588168333986-5078d3ae3976?auto=format&fit=crop&w=600&q=80';
  if (name.includes('pork')) return 'https://images.unsplash.com/photo-1432139555190-58524dae6a55?auto=format&fit=crop&w=600&q=80';
  if (name.includes('lamb')) return 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80';
  
  if (name.includes('chicken')) return 'https://images.unsplash.com/photo-1587593810167-a84920ea0781?auto=format&fit=crop&w=600&q=80';
  if (name.includes('turkey')) return 'https://images.unsplash.com/photo-1574672280600-4accfa5b6f98?auto=format&fit=crop&w=600&q=80';
  
  if (name.includes('shrimp') || name.includes('prawn')) return 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?auto=format&fit=crop&w=600&q=80';
  if (name.includes('crab')) return 'https://images.unsplash.com/photo-1559742811-822863c46f43?auto=format&fit=crop&w=600&q=80';
  
  if (name.includes('ice') || name.includes('block')) return 'https://images.unsplash.com/photo-1517646287270-a5a9ca602e5c?auto=format&fit=crop&w=600&q=80';

  // Category Fallbacks
  if (cat.includes('fish')) return 'https://images.unsplash.com/photo-1534483509719-3feaee7c30da?auto=format&fit=crop&w=600&q=80';
  if (cat.includes('meat')) return 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?auto=format&fit=crop&w=600&q=80';
  if (cat.includes('chicken')) return 'https://images.unsplash.com/photo-1587593810167-a84920ea0781?auto=format&fit=crop&w=600&q=80';
  if (cat.includes('seafood')) return 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?auto=format&fit=crop&w=600&q=80';

  return 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80';
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
