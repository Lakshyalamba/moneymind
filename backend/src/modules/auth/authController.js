import passport from 'passport';
import jwt from 'jsonwebtoken';
import { handleRouteError } from '../../shared/errors/handler.js';
import * as authService from './authService.js';

export const handleGoogleAuth = (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return res.status(501).json({ error: 'Google authentication is not configured on the server.' });
  }
  const authOptions = {
    scope: ['profile', 'email']
  };
  
  if (req.query.prompt === 'select_account') {
    authOptions.prompt = 'select_account';
  }
  
  passport.authenticate('google', authOptions)(req, res, next);
};

export const handleGoogleCallback = (req, res, next) => {
  const firstFrontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173')
    .split(',')
    .map(url => url.trim())
    .filter(Boolean)[0] || 'http://localhost:5173';

  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return res.redirect(`${firstFrontendUrl}/login?error=oauth_not_configured`);
  }
  
  passport.authenticate('google', { session: false }, async (err, user) => {
    if (err || !user) {
      console.error('Google OAuth authentication failed:', err);
      return res.redirect(`${firstFrontendUrl}/login?error=oauth_failed`);
    }
    
    try {
      const { accessToken, refreshToken } = authService.generateTokens(user);
      await authService.updateUserRefreshToken(user.id, refreshToken);
      authService.setTokenCookies(res, accessToken, refreshToken);
      res.redirect(`${firstFrontendUrl}/dashboard`);
    } catch (dbError) {
      console.error('Google OAuth callback database error:', dbError);
      res.redirect(`${firstFrontendUrl}/login?error=oauth_failed`);
    }
  })(req, res, next);
};

export const refreshTokens = async (req, res) => {
  try {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
      return res.status(401).json({ error: 'No refresh token provided' });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    const user = await authService.getUserById(decoded.userId);

    // Verify user has matching refresh token
    if (!user) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    const { accessToken, refreshToken: newRefreshToken } = authService.generateTokens(user);
    await authService.updateUserRefreshToken(user.id, newRefreshToken);
    authService.setTokenCookies(res, accessToken, newRefreshToken);
    res.json({ message: 'Tokens refreshed successfully' });
  } catch (error) {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
};

export const logout = async (req, res) => {
  try {
    const { refreshToken } = req.cookies;
    if (refreshToken) {
      const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
      await authService.updateUserRefreshToken(decoded.userId, null);
    }
  } catch (error) {
    // Ignore, proceed with cookie clearance
  }

  authService.clearTokenCookies(res);
  res.json({ message: 'Logged out successfully' });
};

export const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const user = await authService.registerUser(name, email, password);
    const { accessToken, refreshToken } = authService.generateTokens(user);
    await authService.updateUserRefreshToken(user.id, refreshToken);
    authService.setTokenCookies(res, accessToken, refreshToken);
    res.status(201).json({
      message: 'User created successfully',
      user: { id: user.id, name: user.name, email: user.email }
    });
  } catch (error) {
    if (error.message === 'User already exists') {
      return res.status(400).json({ error: error.message });
    }
    return handleRouteError(res, error, 'Signup');
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await authService.authenticateUser(email, password);
    const { accessToken, refreshToken } = authService.generateTokens(user);
    await authService.updateUserRefreshToken(user.id, refreshToken);
    authService.setTokenCookies(res, accessToken, refreshToken);
    res.json({
      message: 'Login successful',
      user: { id: user.id, name: user.name, email: user.email }
    });
  } catch (error) {
    if (error.message === 'Invalid email or password') {
      return res.status(400).json({ error: error.message });
    }
    return handleRouteError(res, error, 'Login');
  }
};

export const getProfile = async (req, res) => {
  try {
    const user = await authService.getUserById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user });
  } catch (error) {
    return handleRouteError(res, error, 'Profile fetch');
  }
};

export const updateProfile = async (req, res) => {
  try {
    const user = await authService.updateUserProfile(req.user.userId, req.body);
    res.json({ user, message: 'Profile updated successfully' });
  } catch (error) {
    return handleRouteError(res, error, 'Profile update');
  }
};
