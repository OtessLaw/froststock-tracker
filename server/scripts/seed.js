require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Supplier = require('../models/Supplier');
const Sale = require('../models/Sale');
const StockTransaction = require('../models/StockTransaction');
const Expense = require('../models/Expense');

const connectDB = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB');
};

const seed = async () => {
  await connectDB();

  console.log('🌱 Seeding FrostStock Tracker...');

  // Clear existing data
  await Promise.all([
    User.deleteMany({}),
    Category.deleteMany({}),
    Product.deleteMany({}),
    Supplier.deleteMany({}),
    Sale.deleteMany({}),
    StockTransaction.deleteMany({}),
    Expense.deleteMany({}),
  ]);
  console.log('🗑️  Cleared existing data');

  // === USERS ===
  const adminUser = await User.create({
    name: 'Admin User',
    email: 'admin@froststock.com',
    password: 'Admin1234!',
    role: 'admin',
  });
  const staffUser = await User.create({
    name: 'Staff User',
    email: 'staff@froststock.com',
    password: 'Staff1234!',
    role: 'staff',
  });
  console.log('👥 Users created');

  // === CATEGORIES ===
  const [fish, meat, chicken, seafood, other] = await Category.insertMany([
    { name: 'Fish', description: 'Fresh and frozen fish' },
    { name: 'Meat', description: 'Beef, pork, goat and more' },
    { name: 'Chicken', description: 'Whole chicken and parts' },
    { name: 'Seafood', description: 'Shrimp, prawns, crab, lobster' },
    { name: 'Other', description: 'Other cold store items' },
  ]);
  console.log('📁 Categories created');

  // === SUPPLIERS ===
  const [supplier1, supplier2] = await Supplier.insertMany([
    { name: 'Accra Fish Market', phone: '0244123456', location: 'Accra Central Market', notes: 'Main fish supplier. Delivers Tuesdays and Fridays.' },
    { name: 'Tema Poultry Farm', phone: '0302987654', location: 'Tema Industrial Area', notes: 'Fresh chicken every Monday.' },
  ]);
  console.log('🏭 Suppliers created');

  // === PRODUCTS ===
  const productsData = [
    // Fish
    { name: 'Tilapia', category: fish._id, unit: 'kg', buyingPrice: 32, sellingPrice: 45, currentStock: 45, minimumStock: 10, supplier: supplier1._id },
    { name: 'Kpanla', category: fish._id, unit: 'kg', buyingPrice: 25, sellingPrice: 35, currentStock: 30, minimumStock: 10, supplier: supplier1._id },
    { name: 'Hake', category: fish._id, unit: 'kg', buyingPrice: 40, sellingPrice: 55, currentStock: 25, minimumStock: 8, supplier: supplier1._id },
    { name: 'Red Fish', category: fish._id, unit: 'kg', buyingPrice: 28, sellingPrice: 40, currentStock: 8, minimumStock: 10, supplier: supplier1._id },
    { name: 'Mackerel', category: fish._id, unit: 'kg', buyingPrice: 30, sellingPrice: 42, currentStock: 35, minimumStock: 10, supplier: supplier1._id },
    { name: 'Tuna', category: fish._id, unit: 'kg', buyingPrice: 55, sellingPrice: 75, currentStock: 15, minimumStock: 5, supplier: supplier1._id },
    // Meat
    { name: 'Goat Meat', category: meat._id, unit: 'kg', buyingPrice: 70, sellingPrice: 95, currentStock: 20, minimumStock: 5, supplier: supplier1._id },
    { name: 'Cow Meat', category: meat._id, unit: 'kg', buyingPrice: 65, sellingPrice: 85, currentStock: 18, minimumStock: 5, supplier: supplier1._id },
    { name: 'Cow Leg', category: meat._id, unit: 'kg', buyingPrice: 45, sellingPrice: 60, currentStock: 12, minimumStock: 5, supplier: supplier1._id },
    { name: 'Pig Leg', category: meat._id, unit: 'kg', buyingPrice: 40, sellingPrice: 55, currentStock: 3, minimumStock: 5, supplier: supplier1._id },
    { name: 'Cow Skin (Wele)', category: meat._id, unit: 'kg', buyingPrice: 30, sellingPrice: 45, currentStock: 10, minimumStock: 5, supplier: supplier1._id },
    { name: 'Intestine (Tumtum)', category: meat._id, unit: 'kg', buyingPrice: 20, sellingPrice: 30, currentStock: 6, minimumStock: 3, supplier: supplier1._id },
    // Chicken
    { name: 'Chicken Thigh', category: chicken._id, unit: 'kg', buyingPrice: 28, sellingPrice: 38, currentStock: 40, minimumStock: 10, supplier: supplier2._id },
    { name: 'Chicken Wings', category: chicken._id, unit: 'kg', buyingPrice: 22, sellingPrice: 32, currentStock: 35, minimumStock: 10, supplier: supplier2._id },
    { name: 'Chicken Drumstick', category: chicken._id, unit: 'kg', buyingPrice: 24, sellingPrice: 34, currentStock: 28, minimumStock: 8, supplier: supplier2._id },
    { name: 'Chicken Breast', category: chicken._id, unit: 'kg', buyingPrice: 35, sellingPrice: 48, currentStock: 20, minimumStock: 8, supplier: supplier2._id },
    { name: 'Whole Chicken', category: chicken._id, unit: 'piece', buyingPrice: 85, sellingPrice: 120, currentStock: 15, minimumStock: 5, supplier: supplier2._id },
    { name: 'Gizzard', category: chicken._id, unit: 'kg', buyingPrice: 18, sellingPrice: 28, currentStock: 2, minimumStock: 5, supplier: supplier2._id },
    // Seafood
    { name: 'Shrimp', category: seafood._id, unit: 'kg', buyingPrice: 90, sellingPrice: 130, currentStock: 8, minimumStock: 3, supplier: supplier1._id },
    { name: 'Prawn', category: seafood._id, unit: 'kg', buyingPrice: 110, sellingPrice: 155, currentStock: 5, minimumStock: 3, supplier: supplier1._id },
    { name: 'Crab', category: seafood._id, unit: 'kg', buyingPrice: 80, sellingPrice: 120, currentStock: 4, minimumStock: 3, supplier: supplier1._id },
  ];

  const products = await Product.insertMany(productsData);
  console.log(`📦 ${products.length} products created`);

  // === SAMPLE EXPENSES ===
  await Expense.insertMany([
    { category: 'electricity', description: 'Monthly electricity bill', amount: 500, paymentMethod: 'bank', date: new Date(Date.now() - 5 * 86400000), user: adminUser._id, userName: adminUser.name },
    { category: 'ice', description: 'Ice blocks for display', amount: 80, paymentMethod: 'cash', date: new Date(Date.now() - 2 * 86400000), user: adminUser._id, userName: adminUser.name },
    { category: 'transport', description: 'Delivery to Tema Market', amount: 150, paymentMethod: 'mobile_money', date: new Date(Date.now() - 1 * 86400000), user: adminUser._id, userName: adminUser.name },
  ]);
  console.log('💸 Sample expenses created');

  // === SAMPLE SALES ===
  const tilapia = products.find(p => p.name === 'Tilapia');
  const goat = products.find(p => p.name === 'Goat Meat');
  const wings = products.find(p => p.name === 'Chicken Wings');
  const kpanla = products.find(p => p.name === 'Kpanla');
  const chickenThigh = products.find(p => p.name === 'Chicken Thigh');

  const makeSale = (items, paymentMethod, daysAgo, user) => {
    let subtotal = 0, totalCost = 0;
    const saleItems = items.map(({ product, qty }) => {
      const s = Number((qty * product.sellingPrice).toFixed(2));
      const c = Number((qty * product.buyingPrice).toFixed(2));
      subtotal += s; totalCost += c;
      return { product: product._id, productName: product.name, category: '', quantity: qty, unit: product.unit, sellingPrice: product.sellingPrice, costPrice: product.buyingPrice, subtotal: s, profit: s - c };
    });
    const date = new Date(Date.now() - daysAgo * 86400000);
    return { items: saleItems, subtotal, total: subtotal, totalCost, grossProfit: subtotal - totalCost, paymentMethod, user: user._id, userName: user.name, createdAt: date, updatedAt: date };
  };

  const salesData = [
    makeSale([{ product: tilapia, qty: 2 }, { product: goat, qty: 1 }], 'cash', 0, adminUser),
    makeSale([{ product: wings, qty: 1.5 }, { product: kpanla, qty: 2 }], 'mobile_money', 0, staffUser),
    makeSale([{ product: chickenThigh, qty: 3 }, { product: tilapia, qty: 1.5 }], 'cash', 1, adminUser),
    makeSale([{ product: goat, qty: 2 }, { product: wings, qty: 1 }], 'cash', 1, staffUser),
    makeSale([{ product: tilapia, qty: 4 }], 'bank', 2, adminUser),
    makeSale([{ product: kpanla, qty: 2.5 }, { product: chickenThigh, qty: 1 }], 'cash', 3, staffUser),
    makeSale([{ product: wings, qty: 2 }, { product: goat, qty: 0.5 }], 'mobile_money', 4, adminUser),
    makeSale([{ product: tilapia, qty: 3 }, { product: wings, qty: 2 }], 'cash', 5, staffUser),
    makeSale([{ product: chickenThigh, qty: 2 }, { product: kpanla, qty: 1.5 }], 'cash', 6, adminUser),
  ];

  // Create sales with auto-generated saleNumbers
  for (const saleData of salesData) {
    const count = await Sale.countDocuments();
    const sale = new Sale({ ...saleData, saleNumber: `FS${String(count + 1).padStart(5, '0')}` });
    await sale.save();
  }
  console.log(`🛒 ${salesData.length} sample sales created`);

  console.log('\n✅ Seed complete!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔑 Demo Accounts:');
  console.log('   Admin:  admin@froststock.com  / Admin1234!');
  console.log('   Staff:  staff@froststock.com  / Staff1234!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  process.exit(0);
};

seed().catch(err => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
