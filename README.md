# MoneyMind - Personal Finance Management System

A comprehensive personal finance web application that helps you track expenses, manage income, set financial goals, and visualize your financial health with beautiful charts and analytics.

## � Demo Credentials

Want to try the app without signing up? Use these credentials to explore all features:

- **Email:** moneymind@gmail.com
- **Password:** happybudgeting

> The demo account comes pre-loaded with sample transactions and goals to help you explore the app's functionality.


## �🌟 Features

### 💰 Financial Management
- **Transaction Tracking**: Record and categorize income and expenses
- **Dashboard Analytics**: Visual insights with interactive charts (Recharts)
  - Income vs. Expenses overview
  - Budget progress tracking
  - Category-wise expense breakdown
  - Recent transactions summary
- **Goals Management**: Set and track financial goals with progress visualization
- **Smart Filtering**: Search, filter, and sort transactions by date, amount, category, or type
- **Pagination**: Efficiently navigate through large transaction histories

### 🔐 Authentication & Security
- **User Authentication**: Secure signup and login with JWT tokens
- **Google OAuth**: Quick sign-in with Google account
- **httpOnly Cookies**: Secure token storage preventing XSS attacks
- **Password Hashing**: Bcrypt encryption for user passwords
- **Refresh Tokens**: Auto-refresh mechanism for seamless user experience
- **Protected Routes**: Middleware-protected API endpoints

### 👤 User Features
- **User Profile**: View and manage account information
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Modern UI**: Clean, intuitive interface with smooth animations

## 🛠️ Tech Stack

### Frontend
- **React** (v18.2.0) - UI library
- **Vite** - Fast build tool and dev server
- **React Router DOM** - Client-side routing
- **Recharts** - Data visualization and charts
- **Axios** - HTTP client for API requests
- **Pure CSS** - Custom styling (no framework dependencies)

### Backend
- **Node.js** - Runtime environment
- **Express** - Web application framework
- **Prisma** - Modern ORM for database operations
- **PostgreSQL** (Neon) - Cloud database
- **JWT** - JSON Web Tokens for authentication
- **Bcryptjs** - Password hashing
- **Passport.js** - OAuth authentication
- **Cookie Parser** - Cookie handling middleware

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v16 or higher)
- **npm** or **yarn** package manager
- **Git** for version control
- **PostgreSQL database** (or Neon cloud database account)

## 🚀 Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/Lakshyalamba/moneymind.git
cd moneymind
```

### 2. Backend Setup

Navigate to backend directory:
```bash
cd backend
```

Install dependencies:
```bash
npm install
```

Configure environment variables:

Create a `.env` file in the backend directory with the following variables:

```env
# PostgreSQL Database Configuration
DATABASE_URL="postgresql://user:password@host/database?sslmode=require"

# JWT Secret Key
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"

# Server Port
PORT=3333

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173

# Backend URL (for reference)
BACKEND_URL=http://localhost:3333
```

Generate Prisma client and sync database:
```bash
npx prisma generate
npx prisma db push
```

Start the backend server:

Development mode (with auto-restart on file changes):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The backend will run on **http://localhost:3333**

### 3. Frontend Setup

Navigate to frontend directory:
```bash
cd ../frontend
```

Install dependencies:
```bash
npm install
```

Configure environment variables:

Create a `.env` file in the frontend directory:

```env
VITE_API_URL=http://localhost:3333
```

Start the development server:
```bash
npm run dev
```

The frontend will run on **http://localhost:5173**

Build for production:
```bash
npm run build
```

## 📱 Application Pages

- **Landing Page** (`/`) - Marketing page with app overview
- **Signup** (`/signup`) - Create new account
- **Login** (`/login`) - User authentication
- **Dashboard** (`/dashboard`) - Financial overview with charts
- **Transactions** (`/transactions`) - View and manage all transactions
- **Add Transaction** (`/add-transaction`) - Record new income/expense
- **Goals** (`/goals`) - Set and track financial goals
- **Profile** (`/profile`) - User account information

## 🔌 API Endpoints

### Authentication
- `POST /api/signup` - Create new user account
- `POST /api/login` - Authenticate user and receive tokens
- `POST /api/auth/refresh-token` - Refresh access token
- `POST /api/auth/logout` - Logout and clear cookies
- `GET /api/auth/google` - Initiate Google OAuth flow
- `GET /api/auth/google/callback` - Google OAuth callback handler

### User
- `GET /api/profile` - Get authenticated user profile (protected)

### Transactions
- `GET /api/transactions` - Get all user transactions with filtering/pagination (protected)
- `POST /api/transactions` - Create new transaction (protected)
- `PUT /api/transactions/:id` - Update transaction (protected)
- `DELETE /api/transactions/:id` - Delete transaction (protected)

### Goals
- `GET /api/goals` - Get all user goals (protected)
- `POST /api/goals` - Create new goal (protected)
- `PUT /api/goals/:id` - Update goal (protected)
- `DELETE /api/goals/:id` - Delete goal (protected)

## 🗄️ Database Schema

### User Model
- id, name, email, password (hashed)
- refreshToken (for JWT refresh)
- Relationships: transactions[], goals[]

### Transaction Model
- id, amount, type (income/expense), category, note, date
- Relationships: user (belongs to User)

### Goal Model
- id, title, targetAmount, currentAmount, deadline
- Relationships: user (belongs to User)

## 🔒 Security Features

- **JWT Authentication** with access and refresh tokens
- **httpOnly Cookies** for secure token storage
- **Password Hashing** with bcryptjs (10 rounds)
- **CORS Configuration** for cross-origin security
- **Environment Variables** for sensitive data
- **Protected Routes** with authentication middleware
- **SQL Injection Protection** via Prisma ORM

## 🎨 Design Highlights

- Modern, clean interface
- Responsive layout for all device sizes
- Interactive charts and visualizations
- Smooth animations and transitions
- Intuitive navigation
- Accessible components

## 🐛 Troubleshooting

### Backend won't start
- Ensure PostgreSQL database is accessible
- Check `.env` file has correct DATABASE_URL
- Run `npx prisma generate` and `npx prisma db push`

### Frontend can't connect to backend
- Verify backend is running on port 3333
- Check VITE_API_URL in frontend `.env` matches backend URL
- Ensure CORS is properly configured in backend

### Login shows internal server error
- Restart backend server to apply latest code changes
- Check backend terminal for error logs
- Verify database connection is working

### Recommended: Use `npm run dev` for backend
For better development experience, use `npm run dev` instead of `npm start`. This enables **nodemon** which automatically restarts the server when you make code changes.

## 👥 Contributing

Contributions are welcome! Please follow these steps:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Built with modern web technologies
- Inspired by best practices in full-stack development
- Community-driven improvements

---

**Happy Budgeting! 💰📊**
