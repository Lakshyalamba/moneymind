import express from 'express';
import { PrismaClient } from '@prisma/client';
import authRoutes from './modules/auth/authRoutes.js';
import transactionsRoutes from './modules/transactions/transactionsRoutes.js';
import budgetsRoutes from './modules/budgets/budgetsRoutes.js';
import goalsRoutes from './modules/goals/goalsRoutes.js';
import subscriptionsRoutes from './modules/subscriptions/subscriptionsRoutes.js';
import notificationsRoutes from './modules/notifications/notificationsRoutes.js';
import analyticsRoutes from './modules/analytics/analyticsRoutes.js';
import aiRoutes from './modules/ai/aiRoutes.js';

const router = express.Router();
const prisma = new PrismaClient();

// Mount domain modules
router.use(authRoutes);
router.use(transactionsRoutes);
router.use(budgetsRoutes);
router.use(goalsRoutes);
router.use(subscriptionsRoutes);
router.use(notificationsRoutes);
router.use(analyticsRoutes);
router.use(aiRoutes);

// General/System Routes
// GET /api/health - Health check status
router.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: 'OK',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      database: 'Connected'
    });
  } catch (error) {
    console.error('Healthcheck database error:', error.message);
    res.status(500).json({
      status: 'ERROR',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      database: 'Disconnected'
    });
  }
});

// GET /api/openapi.json - OpenAPI Spec
router.get('/openapi.json', (req, res) => {
  res.json({
    openapi: '3.0.0',
    info: {
      title: 'MoneyMind API Documentation',
      version: '1.0.0',
      description: 'Production-grade personal finance management API spec.'
    },
    paths: {
      '/api/health': {
        get: {
          summary: 'Retrieve server status and database connectivity',
          responses: {
            200: { description: 'Success' }
          }
        }
      },
      '/api/transactions': {
        get: {
          summary: 'List user transactions with sorting and pagination',
          responses: {
            200: { description: 'List of transactions' }
          }
        },
        post: {
          summary: 'Create a new transaction (runs automatic categorization and anomaly checks)',
          responses: {
            201: { description: 'Created successfully' }
          }
        }
      },
      '/api/budgets': {
        get: {
          summary: 'Fetch category budgets with forecasts and daily rates',
          responses: {
            200: { description: 'List of budgets' }
          }
        }
      }
    }
  });
});

// GET /api/docs - Serve Swagger-UI HTML page using CDN
router.get('/docs', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>MoneyMind API Specs</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css" />
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    window.onload = () => {
      window.ui = SwaggerUIBundle({
        url: '/api/openapi.json',
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis
        ],
        layout: "BaseLayout"
      });
    };
  </script>
</body>
</html>
  `);
});

export default router;
