import { createApp } from './app.js';
import { connectDatabase } from './config/database.js';
import { env } from './config/env.js';

try {
  if (!env.jwtSecret || Buffer.byteLength(env.jwtSecret, 'utf8') < 32) {
    throw new Error('JWT_SECRET must contain at least 32 bytes.');
  }
  let clientOrigin;
  try {
    clientOrigin = new URL(env.clientUrl);
  } catch {
    throw new Error('CLIENT_URL must be a specific HTTP(S) origin, not a wildcard.');
  }
  if (!['http:', 'https:'].includes(clientOrigin.protocol) || clientOrigin.origin !== env.clientUrl) {
    throw new Error('CLIENT_URL must be a specific HTTP(S) origin, not a wildcard.');
  }

  await connectDatabase(env.mongodbUri);
  const app = createApp();
  app.listen(env.port, () => {
    console.log(`API server listening on port ${env.port}.`);
  });
} catch (error) {
  if (error.name === 'Error') {
    console.error(`Server startup failed: ${error.message}`);
  } else {
    console.error(`MongoDB connection failed (${error.name}). Check MONGODB_URI and database availability.`);
  }
  process.exitCode = 1;
}