import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const clientID = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
const callbackURL = process.env.BACKEND_URL 
  ? `${process.env.BACKEND_URL}/api/auth/google/callback` 
  : 'http://localhost:3333/api/auth/google/callback';

if (clientID && clientSecret) {
  passport.use(new GoogleStrategy({
    clientID,
    clientSecret,
    callbackURL
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      // 1. Try to find the user by googleId
      let user = await prisma.user.findUnique({
        where: { googleId: profile.id }
      });

      if (!user) {
        // 2. Try to find user by email
        const email = profile.emails?.[0]?.value;
        if (!email) {
          return done(new Error('No email found in Google profile'), null);
        }

        user = await prisma.user.findUnique({
          where: { email }
        });

        if (user) {
          // 3. Link Google account to existing email user
          user = await prisma.user.update({
            where: { id: user.id },
            data: { googleId: profile.id }
          });
        } else {
          // 4. Create new user without password (password remains null/optional)
          user = await prisma.user.create({
            data: {
              name: profile.displayName || 'Google User',
              email,
              googleId: profile.id
            }
          });
        }
      }

      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }));
} else {
  console.warn('⚠️ Google OAuth environment variables (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET) are not configured. Google Sign-In is disabled.');
}
