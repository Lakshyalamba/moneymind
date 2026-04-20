# MoneyMind

MoneyMind is a personal finance web application for tracking income and expenses, managing savings goals, reviewing dashboard analytics, and chatting with an AI finance assistant based on your transaction history.

## Demo Credentials

Use the seeded demo account to explore the app without creating a new user:

- Email: `moneymind@gmail.com`
- Password: `happytransactions`

## Features

- User signup, login, logout, and token refresh with secure cookies
- Dashboard with income, expenses, balance, recent transactions, and charts
- Transaction management with filtering, sorting, pagination, create, update, and delete flows
- Goal management with create, update, and delete support
- Profile page for viewing and editing account details
- Dedicated `Chat` page for AI-powered finance guidance
- Floating AI assistant widget on authenticated pages
- Finance utility widgets on the dashboard, including currency, SIP, EMI, FD, and GST tools
- Responsive frontend built with React and Vite

## Tech Stack

### Frontend

- React
- Vite
- React Router
- Recharts
- React Icons
- CSS

### Backend

- Node.js
- Express
- Prisma
- PostgreSQL
- JWT
- bcryptjs
- cookie-parser
- CORS
- Google Gemini API with local fallback advice logic

## Project Structure

```text
moneymind/
|-- backend/
|   |-- prisma/
|   `-- src/
|-- frontend/
|   |-- public/
|   `-- src/
`-- README.md
```

## Local Setup

### Prerequisites

- Node.js 18 or newer
- npm
- PostgreSQL

### 1. Clone the repository

```bash
git clone https://github.com/Lakshyalamba/moneymind.git
cd moneymind
```

### 2. Configure the backend

```bash
cd backend
npm install
```

Create `backend/.env`:

```env
DATABASE_URL="postgresql://postgres:password@127.0.0.1:5432/moneymind?sslmode=disable"
JWT_SECRET="change-this-in-production"
GEMINI_API_KEY="your-gemini-api-key"
PORT=3333
FRONTEND_URL="http://127.0.0.1:5173"
```

Notes:

- `GEMINI_API_KEY` is optional. If it is missing or Gemini is unavailable, the backend falls back to local finance advice so chat still works.
- `FRONTEND_URL` must match the frontend origin for cookie-based auth and CORS.

Initialize the database and seed the demo user:

```bash
npx prisma generate
npm run db:push
npm run db:seed
```

Start the backend:

```bash
npm start
```

For watch mode:

```bash
npm run dev
```

The backend runs on `http://127.0.0.1:3333`.

### 3. Configure the frontend

```bash
cd ../frontend
npm install
```

Create `frontend/.env`:

```env
VITE_API_URL="http://127.0.0.1:3333"
```

Start the frontend:

```bash
npm run dev
```

The frontend runs on `http://127.0.0.1:5173`.

To create a production build:

```bash
npm run build
```

## Environment Variables

### Backend

- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: JWT signing secret
- `GEMINI_API_KEY`: Gemini API key for AI chat responses
- `PORT`: backend port
- `FRONTEND_URL`: allowed frontend origin for cookies and CORS

### Frontend

- `VITE_API_URL`: backend base URL used by the frontend

## Application Routes

- `/`: landing page
- `/login`: login page
- `/signup`: signup page
- `/dashboard`: dashboard overview
- `/add-transaction`: create a transaction
- `/transactions`: manage transactions
- `/goals`: manage goals
- `/profile`: view and update profile
- `/chat`: full chat page

## API Summary

### Authentication

- `POST /api/signup`
- `POST /api/login`
- `POST /api/auth/refresh-token`
- `POST /api/auth/logout`

### Profile

- `GET /api/profile`
- `PUT /api/profile`

### Transactions

- `GET /api/transactions`
- `POST /api/transactions`
- `PUT /api/transactions/:id`
- `DELETE /api/transactions/:id`

### Goals

- `GET /api/goals`
- `POST /api/goals`
- `PUT /api/goals/:id`
- `DELETE /api/goals/:id`

### AI Chat

- `POST /api/ai/chat`

## Deployment Notes

MoneyMind has two deployable parts:

- Frontend: static React build, suitable for Netlify or Vercel
- Backend: Express and Prisma server, which must be deployed separately

If you deploy the frontend:

- Set `VITE_API_URL` to your deployed backend URL before building

If you deploy the backend:

- Set `FRONTEND_URL` to your deployed frontend domain
- Use a production PostgreSQL database
- Set a strong `JWT_SECRET`
- Add a valid `GEMINI_API_KEY` if you want live Gemini responses

## Development Notes

- The app uses cookie-based authentication, so frontend and backend origin settings must be aligned correctly.
- The demo login depends on `npm run db:seed`.
- Chat requests are protected routes and require authentication.
- The AI chat layer includes fallback behavior so the UI does not break when Gemini is unavailable.
