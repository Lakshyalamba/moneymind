import { Prisma } from '@prisma/client';

export const isDatabaseUnavailableError = (error) => (
  error instanceof Prisma.PrismaClientInitializationError ||
  error?.name === 'PrismaClientInitializationError' ||
  error?.message?.includes("Can't reach database server")
);

export const handleRouteError = (res, error, context = 'Request') => {
  console.error(`${context} error:`, error);

  if (isDatabaseUnavailableError(error)) {
    return res.status(503).json({
      error: 'Database unavailable. Start PostgreSQL and try again.'
    });
  }

  return res.status(500).json({ error: 'Internal server error' });
};
