# MoneyMind - Personal Finance Web App

A simple login and signup system built with React, Node.js, Express, PostgreSQL, and Prisma.

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- MySQL server running locally
- Git

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Set up your MySQL database:
   - Create a database named `moneymind`
   - Update the `DATABASE_URL` in `.env` file with your MySQL credentials

4. Generate Prisma client and run migrations:
```bash
npx prisma generate
npx prisma db push
```

5. Start the backend server:
```bash
npm run dev
```

The backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

## Features

- **Signup**: Create new user accounts with name, email, and password
- **Login**: Authenticate existing users
- **Google OAuth**: Sign in/up with Google account
- **JWT Authentication**: Access and refresh tokens with httpOnly cookies
- **Password Security**: Passwords are hashed using bcryptjs
- **Form Validation**: Client-side validation for required fields and email format
- **Responsive Design**: Clean, centered card layout with basic CSS

## API Endpoints

- `POST /api/signup` - Create new user account
- `POST /api/login` - Authenticate user
- `GET /api/auth/google` - Initiate Google OAuth
- `GET /api/auth/google/callback` - Google OAuth callback
- `POST /api/auth/refresh-token` - Refresh access token
- `POST /api/auth/logout` - Logout and clear cookies

## Tech Stack

- **Frontend**: React with Vite, React Router
- **Backend**: Node.js, Express
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Styling**: Pure CSS
- **Security**: bcryptjs for password hashing, Passport.js for OAuth
- **Authentication**: JWT tokens with httpOnly cookies
