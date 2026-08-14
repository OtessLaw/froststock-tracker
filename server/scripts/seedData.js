const User = require('../models/User');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Supplier = require('../models/Supplier');
const Sale = require('../models/Sale');
const StockTransaction = require('../models/StockTransaction');
const Expense = require('../models/Expense');

const seedData = async () => {
  console.log('🌱 Auto-seeding FrostStock Tracker cloud database...');

  // === USERS ===
  const adminUser = await User.create({
    name: 'Admin User',
    email: 'admin@froststock.com',
    password: 'Admin1234!',
    role: 'admin',
    active: true,
  });

  const staffUser = await User.create({
    name: 'Staff User',
    email: 'staff@froststock.com',
    password: 'Staff1234!',
    role: 'staff',
    active: true,
  });
  console.log('👥 Demo users created');

  // === CATEGORIES ===
  const categories = await Category.insertMany([
    { name: 'Fish', description: 'Frozen ocean & fresh water fish' },
    { name: 'Meat', description: 'Beef, goat meat, pork & lamb' },
    { name: 'Chicken', description: 'Whole chicken, wings, drumsticks & turkey' },
    { name: 'Seafood', description: 'Shrimp, prawns, crab & lobster' },
    { name: 'Other', description: 'Sausages, ice blocks & accessories' },
  ]);
  console.log('📁 Categories created');

  const catMap = {};
  categories.forEach((c) => { catMap[c.name] = c._id; });

  // === SUPPLIERS ===
  const suppliers = await Supplier.insertMany([
    { name: 'Accra Fish Market Ltd', phone: '0244123456', location: 'Tema Harbour', notes: 'Main fish importer' },
    { name: 'Tema Poultry & Meat Farm', phone: '0208654321', location: 'Tema Industrial Area', notes: 'Chicken & turkey supplier' },
  ]);
  console.log('🏭 Suppliers created');

  // === PRODUCTS ===
  const productsData = [
    { name: 'Sausages (Pork & Beef)', category: catMap['Other'], unit: 'pack', buyingPrice: 25, sellingPrice: 35, currentStock: 45, minimumStock: 10, image: 'https://images.unsplash.com/photo-1529042410759-befb1204b468?auto=format&fit=crop&w=600&q=80' },
    { name: 'Tilapia (Large)', category: catMap['Fish'], unit: 'kg', buyingPrice: 32, sellingPrice: 45, currentStock: 50, minimumStock: 10, supplier: suppliers[0]._id, image: 'https://images.unsplash.com/photo-1534483509719-3feaee7c30da?auto=format&fit=crop&w=600&q=80' },
    { name: 'Tilapia (Medium)', category: catMap['Fish'], unit: 'kg', buyingPrice: 26, sellingPrice: 38, currentStock: 35, minimumStock: 8, supplier: suppliers[0]._id, image: 'https://images.unsplash.com/photo-1534483509719-3feaee7c30da?auto=format&fit=crop&w=600&q=80' },
    { name: 'Kpanla (Horse Mackerel)', category: catMap['Fish'], unit: 'kg', buyingPrice: 22, sellingPrice: 32, currentStock: 80, minimumStock: 15, supplier: suppliers[0]._id, image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=600&q=80' },
    { name: 'Red Fish (Red Snapper)', category: catMap['Fish'], unit: 'kg', buyingPrice: 40, sellingPrice: 58, currentStock: 25, minimumStock: 5, supplier: suppliers[0]._id, image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=80' },
    { name: 'Hake Fish', category: catMap['Fish'], unit: 'kg', buyingPrice: 20, sellingPrice: 30, currentStock: 60, minimumStock: 10, supplier: suppliers[0]._id, image: 'https://images.unsplash.com/photo-1498654896293-37aacf113fd9?auto=format&fit=crop&w=600&q=80' },
    { name: 'Salmon Cutlets', category: catMap['Fish'], unit: 'kg', buyingPrice: 55, sellingPrice: 75, currentStock: 15, minimumStock: 5, supplier: suppliers[0]._id, image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=600&q=80' },
    { name: 'Tuna (Whole)', category: catMap['Fish'], unit: 'kg', buyingPrice: 30, sellingPrice: 42, currentStock: 4, minimumStock: 10, supplier: suppliers[0]._id, image: 'https://images.unsplash.com/photo-1501595091296-3aa970afb3ff?auto=format&fit=crop&w=600&q=80' },

    { name: 'Goat Meat (Cut)', category: catMap['Meat'], unit: 'kg', buyingPrice: 45, sellingPrice: 65, currentStock: 30, minimumStock: 8, supplier: suppliers[1]._id, image: 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?auto=format&fit=crop&w=600&q=80' },
    { name: 'Cow Leg (Paws)', category: catMap['Meat'], unit: 'piece', buyingPrice: 35, sellingPrice: 50, currentStock: 12, minimumStock: 5, supplier: suppliers[1]._id, image: 'https://images.unsplash.com/photo-1588168333986-5078d3ae3976?auto=format&fit=crop&w=600&q=80' },
    { name: 'Beef (Boneless)', category: catMap['Meat'], unit: 'kg', buyingPrice: 40, sellingPrice: 58, currentStock: 40, minimumStock: 10, supplier: suppliers[1]._id, image: 'https://images.unsplash.com/photo-1588168333986-5078d3ae3976?auto=format&fit=crop&w=600&q=80' },
    { name: 'Pork Chops', category: catMap['Meat'], unit: 'kg', buyingPrice: 35, sellingPrice: 50, currentStock: 20, minimumStock: 5, supplier: suppliers[1]._id, image: 'https://images.unsplash.com/photo-1432139555190-58524dae6a55?auto=format&fit=crop&w=600&q=80' },
    { name: 'Lamb Shoulder', category: catMap['Meat'], unit: 'kg', buyingPrice: 50, sellingPrice: 72, currentStock: 3, minimumStock: 5, supplier: suppliers[1]._id, image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80' },

    { name: 'Hard Chicken (Whole)', category: catMap['Chicken'], unit: 'piece', buyingPrice: 38, sellingPrice: 52, currentStock: 45, minimumStock: 10, supplier: suppliers[1]._id, image: 'https://images.unsplash.com/photo-1587593810167-a84920ea0781?auto=format&fit=crop&w=600&q=80' },
    { name: 'Soft Chicken (Whole)', category: catMap['Chicken'], unit: 'piece', buyingPrice: 32, sellingPrice: 45, currentStock: 50, minimumStock: 10, supplier: suppliers[1]._id, image: 'https://images.unsplash.com/photo-1587593810167-a84920ea0781?auto=format&fit=crop&w=600&q=80' },
    { name: 'Chicken Wings (Carton 10kg)', category: catMap['Chicken'], unit: 'carton', buyingPrice: 180, sellingPrice: 240, currentStock: 15, minimumStock: 4, supplier: suppliers[1]._id, image: 'https://images.unsplash.com/photo-1587593810167-a84920ea0781?auto=format&fit=crop&w=600&q=80' },
    { name: 'Chicken Drumsticks', category: catMap['Chicken'], unit: 'kg', buyingPrice: 28, sellingPrice: 40, currentStock: 30, minimumStock: 8, supplier: suppliers[1]._id, image: 'https://images.unsplash.com/photo-1587593810167-a84920ea0781?auto=format&fit=crop&w=600&q=80' },
    { name: 'Turkey Wings', category: catMap['Chicken'], unit: 'kg', buyingPrice: 35, sellingPrice: 50, currentStock: 25, minimumStock: 6, supplier: suppliers[1]._id, image: 'https://images.unsplash.com/photo-1574672280600-4accfa5b6f98?auto=format&fit=crop&w=600&q=80' },

    { name: 'Shrimp (Medium)', category: catMap['Seafood'], unit: 'kg', buyingPrice: 60, sellingPrice: 85, currentStock: 10, minimumStock: 3, supplier: suppliers[0]._id, image: 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?auto=format&fit=crop&w=600&q=80' },
    { name: 'Prawns (Jumbo)', category: catMap['Seafood'], unit: 'kg', buyingPrice: 90, sellingPrice: 125, currentStock: 2, minimumStock: 3, supplier: suppliers[0]._id, image: 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?auto=format&fit=crop&w=600&q=80' },
    { name: 'Crab (Fresh Frozen)', category: catMap['Seafood'], unit: 'kg', buyingPrice: 40, sellingPrice: 60, currentStock: 8, minimumStock: 3, supplier: suppliers[0]._id, image: 'https://images.unsplash.com/photo-1559742811-822863c46f43?auto=format&fit=crop&w=600&q=80' },

    { name: 'Ice Block (Large)', category: catMap['Other'], unit: 'block', buyingPrice: 5, sellingPrice: 12, currentStock: 100, minimumStock: 20, image: 'https://images.unsplash.com/photo-1517646287270-a5a9ca602e5c?auto=format&fit=crop&w=600&q=80' },
  ];

  await Product.insertMany(productsData);
  console.log('📦 21 products auto-seeded successfully!');
};

module.exports = seedData;
