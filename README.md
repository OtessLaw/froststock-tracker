# FrostStock Tracker 🧊

**Cold Store Inventory & Sales Management System**

A fully functional, production-ready web application for managing a cold store's inventory, sales, expenses, and profits. Built mobile-first for ease of use on the shop floor.

---

## Demo Credentials

| Role  | Email                    | Password    |
|-------|--------------------------|-------------|
| Admin | admin@froststock.com     | Admin1234!  |
| Staff | staff@froststock.com     | Staff1234!  |

---

## Quick Start

### Prerequisites
- Node.js v18+ 
- MongoDB (local or Atlas)

### 1. Configure Environment

Copy the `.env` file in the root and update `MONGODB_URI`:

```env
# Local MongoDB
MONGODB_URI=mongodb://localhost:27017/froststock

# MongoDB Atlas
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/froststock?retryWrites=true&w=majority
```

> **Important:** Change `JWT_SECRET` to a strong random string in production.

---

### 2. Start the Backend Server

```bash
cd server
npm install
npm run dev
```

Server starts at: `http://localhost:5000`

---

### 3. Seed Demo Data (Optional but Recommended)

```bash
cd server
npm run seed
```

This creates:
- 5 categories (Fish, Meat, Chicken, Seafood, Other)
- 21 products with realistic prices and stock
- 2 suppliers
- Sample sales from the past week
- 3 sample expenses
- 2 user accounts (admin + staff)

---

### 4. Start the Frontend

```bash
cd client
npm install
npm run dev
```

Frontend starts at: `http://localhost:5173`

---

## MongoDB Setup

### Option A: Local MongoDB

1. Install [MongoDB Community](https://www.mongodb.com/try/download/community)
2. Start MongoDB service
3. Set `MONGODB_URI=mongodb://localhost:27017/froststock`

### Option B: MongoDB Atlas (Cloud - Free Tier)

1. Go to [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Create a free cluster
3. Create a database user with read/write access
4. Whitelist your IP address (or `0.0.0.0/0` for all)
5. Get the connection string and set it as `MONGODB_URI` in `.env`

---

## Project Structure

```
rose/
├── client/                     # React frontend (Vite)
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   ├── pages/              # Page components
│   │   ├── layouts/            # Layout wrappers
│   │   ├── context/            # Auth context
│   │   ├── services/           # Axios API service
│   │   ├── utils/              # Helpers (formatMoney, formatDate, etc.)
│   │   ├── App.jsx             # Routes
│   │   └── main.jsx            # Entry point
│   └── package.json
│
├── server/                     # Express backend
│   ├── controllers/            # Business logic
│   ├── models/                 # MongoDB/Mongoose models
│   ├── routes/                 # API routes
│   ├── middleware/             # Auth + error handler
│   ├── config/                 # Database config
│   ├── scripts/                # Seed script
│   └── server.js               # Entry point
│
├── .env                        # Environment variables
└── .gitignore
```

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/login | Login |
| GET | /api/auth/me | Get current user |
| POST | /api/auth/register | Create user (admin) |
| GET | /api/categories | List categories |
| GET | /api/products | List products (search, filter) |
| POST | /api/products | Create product (admin) |
| PUT | /api/products/:id | Update product (admin) |
| POST | /api/stock/add | Add stock |
| POST | /api/stock/adjust | Adjust stock (admin) |
| GET | /api/stock/history | Stock movement log |
| POST | /api/sales | Create sale (validates + deducts stock) |
| GET | /api/sales | Sales list |
| GET | /api/sales/:id | Sale detail |
| GET | /api/suppliers | List suppliers |
| GET | /api/expenses | List expenses |
| POST | /api/expenses | Add expense |
| GET | /api/reports/dashboard | Dashboard statistics |
| GET | /api/reports/sales | Sales report |
| GET | /api/reports/inventory | Inventory report |

---

## Key Features

- **Mobile-first** — Bottom navigation on phones, sidebar on desktop
- **Quick Sale** — Record a sale in under 10 seconds
- **Automatic stock deduction** — Sell a product, stock updates instantly
- **Historical price accuracy** — Old sales keep their original prices
- **Role-based access** — Admin vs Staff permissions
- **Low stock alerts** — Dashboard warnings when stock is low
- **Profit tracking** — Gross profit per sale, net profit after expenses
- **Ghana currency** — GH₵ throughout
- **PDF receipts** — Download after each sale
- **CSV export** — Sales and inventory reports

---

## Test Workflow

1. Login as Admin
2. Go to Products → Add a product
3. Go to Stock → Add 50kg of stock
4. Go to New Sale → Select product, enter 2.5kg
5. Complete Sale → Verify stock dropped to 47.5kg
6. View Sales History → Confirm sale recorded
7. View Reports → Check today's revenue and profit

---

## Production Deployment

1. Build the frontend: `cd client && npm run build`
2. Serve the `dist/` folder with a static host (Vercel, Netlify, etc.)
3. Deploy the server to Railway, Render, or any Node.js host
4. Set production environment variables
5. Set `NODE_ENV=production` in server `.env`
6. Change `JWT_SECRET` to a strong secret
7. Configure CORS `CLIENT_URL` to your frontend domain
8. Use MongoDB Atlas for the database

---

## Tech Stack

**Frontend:** React, Vite, Tailwind CSS, React Router, Axios, Recharts, Lucide React, jsPDF

**Backend:** Node.js, Express.js, MongoDB, Mongoose, JWT, bcryptjs, helmet, express-rate-limit
