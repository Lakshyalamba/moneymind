# Contributing to MoneyMind

Thank you for your interest in contributing to MoneyMind! To maintain code quality and security, please follow these guidelines:

## Pull Request Guidelines
1. Fork the repository and create your branch from `main`.
2. Ensure all backend tests pass locally:
   ```bash
   cd backend
   npm run test
   ```
3. Ensure the project builds without errors:
   ```bash
   cd frontend
   npm run build
   ```
4. Document any new REST endpoints or environment configurations introduced by your pull request.
5. Scope database updates using Prisma migrations. Avoid direct, uncontrolled db pushes on shared environments.
