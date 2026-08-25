# MoneyMind

MoneyMind is a personal finance management web application that helps users track their transactions, monitor subscriptions, analyze spending habits, evaluate financial health scores, forecast monthly budgets, and interact with an AI-powered financial advisor.

---

## Technical Stack

- **Frontend**: React, React Router, Recharts, React Icons, Vite
- **Backend**: Node.js, Express, Passport.js, JWT Cookie Auth
- **Database & ORM**: PostgreSQL, Prisma Client
- **AI Integrations**: Google Gemini API (`gemini-2.5-flash-lite`)

---

## Features

1. **Transaction Ledger**: Logs income and expenses, automatically categorizing descriptions and detecting standard deviation anomalies.
2. **Budget Projections**: Configures monthly limits, calculating daily spending rates and projecting end-of-period statuses.
3. **Savings Goals**: Monitors target values and highlights achievement milestones.
4. **Subscription Center**: Lists recurring active payments, monthly totals, and flags upcoming renewals.
5. **Financial Health Index**: Computes a 0-100 grade based on rolling savings and budget behaviors.
6. **AI Advisor**: Serves context-scoped advice directly related to the user's real transactions.

---

## Installation & Setup

### Prerequisites
- Node.js (v18+)
- PostgreSQL Database instance

### Installation
Clone the repository and install dependencies in both project directories:

```bash
# Backend setup
cd backend
npm install
npx prisma db push

# Frontend setup
cd ../frontend
npm install
```

### Running Locally
1. Configure environment variables in `backend/.env` (see `backend/.env.example`).
2. Populate initial database schema and mock records:
```bash
# Push database schema
cd backend
npx prisma db push

# Seed mock demo records
npm run db:seed
```
3. Start both dev servers:
```bash
# Backend dev server (from backend/)
npm run dev

# Frontend dev server (from frontend/)
npm run dev
```

---

## Extension Points & Developer Guides

MoneyMind is built to be modular and highly extensible. Contributors can read the following guides to learn how to add custom extensions:

- **[AI Provider Customization](file:///Users/lakshyachoudhary/My%20Projects/moneymind/docs/AI_PROVIDERS.md)**: Learn how to add new LLM suppliers.
- **[Transaction Categorization Mappings](file:///Users/lakshyachoudhary/My%20Projects/moneymind/docs/CATEGORIZATION.md)**: Add rules or strategies for transaction description categorizers.
- **[Format Importers / Exporters](file:///Users/lakshyachoudhary/My%20Projects/moneymind/docs/IMPORT_EXPORT.md)**: Support alternative CSV/JSON file ingestion.
- **[Notification Plugs](file:///Users/lakshyachoudhary/My%20Projects/moneymind/docs/NOTIFICATIONS.md)**: Integrate email/SMS warning alerts.
- **[Webhook Pipelines](file:///Users/lakshyachoudhary/My%20Projects/moneymind/docs/WEBHOOKS.md)**: Dispatch real-time financial triggers to third-party endpoints.
- **[Theme Customization](file:///Users/lakshyachoudhary/My%20Projects/moneymind/docs/THEMES.md)**: Customize Light / Dark styling design tokens.

