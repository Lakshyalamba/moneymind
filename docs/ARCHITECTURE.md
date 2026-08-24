# MoneyMind Project Architecture

Welcome to the MoneyMind developer documentation! This guide explains the project structure, design patterns, and request lifecycle to help contributors quickly get started and safely add features.

---

## 1. Project Structure

MoneyMind is structured as a monorepo containing a React frontend and a Node.js Express backend:

```
moneymind/
├── backend/
│   ├── prisma/             # Prisma DB schema & seed scripts
│   ├── src/
│   │   ├── config/         # System configurations (e.g. Passport.js)
│   │   ├── shared/         # Reusable error boundaries, helpers, & middleware
│   │   │   ├── errors/
│   │   │   ├── middleware/
│   │   │   └── utils/
│   │   ├── modules/        # Modular domain contexts
│   │   │   ├── auth/
│   │   │   ├── transactions/
│   │   │   ├── budgets/
│   │   │   ├── goals/
│   │   │   ├── subscriptions/
│   │   │   ├── analytics/
│   │   │   ├── notifications/
│   │   │   └── ai/
│   │   ├── routes.js       # Central router mounting all modules
│   │   ├── index.js        # Server entry file (CORS, CSP, Global limits)
│   │   └── bootstrap.js    # Init DB connections & start server
│   └── run-tests.js        # Native recursive test runner
│
└── frontend/
    └── src/
        ├── features/       # Feature-bounded pages and localized hooks/components
        │   ├── auth/
        │   ├── transactions/
        │   ├── budgets/
        │   ├── goals/
        │   ├── subscriptions/
        │   ├── analytics/
        │   ├── notifications/
        │   └── ai/
        ├── components/     # Truly shared UI components (e.g. Sidebar, Layout)
        ├── styles/         # Shared style variables & UI layouts
        └── utils/          # Token storage and API request wrappers
```

---

## 2. Backend Design Patterns & Architecture

We adhere to a decoupled **layered architecture** in every backend module:
1. **Routes (`*Routes.js`)**: Expose REST endpoints, apply route-specific authentication middleware, and parse request constraints (e.g., query params).
2. **Controllers (`*Controller.js`)**: Act as thin wrapper boundaries. They parse input, delegate business tasks to services, and send JSON responses back.
3. **Services (`*Service.js`)**: Contain 100% of the domain business logic, math, and Prisma query operations. Controllers never invoke Prisma queries directly.
4. **Validation Schema (`*Routes.js`)**: Define rules (e.g., `required`, `positive`, `enum`, `regex`) passed to the shared request body validation middleware.

### Request Lifecycle Flow
```
Client Request -> Global Rate Limiter -> Cors/CSP -> Module Auth Middleware -> Body Validation -> Controller Handler -> Domain Service -> Prisma DB Query -> sanitized JSON response
```

### Database Access Pattern
All database queries must route through **Prisma Client** inside services. Use index definitions inside `prisma/schema.prisma` to guarantee performance for compound queries (e.g. `userId` query bounds).

---

## 3. Frontend Architecture

The frontend is organized around **feature boundaries** under `src/features/`.
- Every page and sub-component specific to a feature resides inside that feature's directory (e.g., `src/features/ai/` contains `AIChat.jsx` and `FinanceChatPanel.jsx`).
- Global widgets or layout boundaries reside under `src/components/` (e.g. `Sidebar.jsx`, `AppLayout.jsx`).
- Shared CSS files are centralized inside `src/styles/` to maintain a unified color palette.

---

## 4. Contributor Workflows

### How to Add a New Backend Module
1. Create a folder under `src/modules/new-feature/`.
2. Implement your:
   - `newFeatureService.js` (for business logic and DB queries)
   - `newFeatureController.js` (to invoke service and map responses)
   - `newFeatureRoutes.js` (for endpoints mapping and validation rules)
3. Mount the new router in `src/routes.js`:
   ```javascript
   import newFeatureRoutes from './modules/new-feature/newFeatureRoutes.js';
   router.use(newFeatureRoutes);
   ```

### How to Add a New Frontend Feature
1. Create a folder under `src/features/new-feature/`.
2. Place page templates (`NewFeature.jsx`) and specialized components inside.
3. Register the route path inside `src/App.jsx`.
