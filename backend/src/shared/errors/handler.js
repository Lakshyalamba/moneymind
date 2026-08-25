import { Prisma } from '@prisma/client';

export const isDatabaseUnavailableError = (error) => (
  error instanceof Prisma.PrismaClientInitializationError ||
  error?.name === 'PrismaClientInitializationError' ||
  error?.message?.includes("Can't reach database server")
);

export const sanitizeErrorMessage = (message) => {
  if (!message) return '';
  // Mask PostgreSQL connection strings
  let scrubbed = message.replace(/(postgres(?:ql)?:\/\/)[^:]+:[^@]+@/g, '$1***:***@');
  // Mask JWT-like signatures
  scrubbed = scrubbed.replace(/(?:eyJ[a-zA-Z0-9-_]+\.eyJ[a-zA-Z0-9-_]+\.)[a-zA-Z0-9-_]+/g, 'eyJ***.eyJ***.***');
  // Mask Google API keys (AIzaSy...)
  scrubbed = scrubbed.replace(/AIzaSy[a-zA-Z0-9-_]{33}/g, 'AIzaSy***');
  return scrubbed;
};

export const handleRouteError = (res, error, context = 'Request') => {
  const errMsg = sanitizeErrorMessage(error?.stack || error?.message || String(error));
  console.error(`[moneymind-error] ${context} error:`, errMsg);

  if (isDatabaseUnavailableError(error)) {
    return res.status(503).json({
      error: 'Database unavailable. Start PostgreSQL and try again.'
    });
  }

  return res.status(500).json({ error: 'Internal server error' });
};
