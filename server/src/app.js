import cors from 'cors';
import cookieParser from 'cookie-parser';
import express from 'express';
import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFound } from './middleware/notFound.js';
import { createApiRouter } from './routes/index.js';
import User from './models/User.js';

export function createApp({ UserModel = User, jwtSecret = env.jwtSecret } = {}) {
	const app = express();

	app.use(cors({
		origin: (origin, callback) => callback(null, origin === env.clientUrl),
		credentials: true,
	}));
	app.use(express.json({ limit: '32kb' }));
	app.use(cookieParser());
	app.use('/api', createApiRouter({ UserModel, jwtSecret }));
	app.use(notFound);
	app.use(errorHandler);

	return app;
}

export default createApp();