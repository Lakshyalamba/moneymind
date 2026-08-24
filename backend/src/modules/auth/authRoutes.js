import express from 'express';
import { authenticateToken } from '../../shared/middleware/auth.js';
import { validateBody } from '../../shared/middleware/validation.js';
import * as authController from './authController.js';

const router = express.Router();

const signupSchema = {
  name: { required: true },
  email: { required: true, regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
  password: { required: true }
};

const loginSchema = {
  email: { required: true, regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
  password: { required: true }
};

// Google OAuth
router.get('/auth/google', authController.handleGoogleAuth);
router.get('/auth/google/callback', authController.handleGoogleCallback);

// Token / Session management
router.post('/auth/refresh-token', authController.refreshTokens);
router.post('/auth/logout', authController.logout);

// Credentials Auth
router.post('/signup', validateBody(signupSchema), authController.signup);
router.post('/login', validateBody(loginSchema), authController.login);

// Profile Management
router.get('/profile', authenticateToken, authController.getProfile);
router.put('/profile', authenticateToken, authController.updateProfile);

export default router;
