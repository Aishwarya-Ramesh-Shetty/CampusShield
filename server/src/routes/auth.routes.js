import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { createAuthenticate } from '../middleware/authenticate.js';
import { AUTH_COOKIE_NAME, getAuthCookieOptions, getClearCookieOptions } from '../security/authCookie.js';
import { toSafeUser } from '../utils/safeUser.js';
import { validateLoginInput, validateRegistrationInput } from '../utils/authValidation.js';

const BCRYPT_COST = 12;
const TOKEN_LIFETIME = '15m';

export function createAuthRouter({ UserModel, jwtSecret }) {
	const router = Router();
	const authenticate = createAuthenticate({ UserModel, jwtSecret });

	router.post('/register', async (request, response, next) => {
		const validation = validateRegistrationInput(request.body ?? {});
		if (validation.error) {
			return response.status(400).json({ success: false, message: validation.error });
		}

		try {
			const { name, email, password, studentId } = validation.value;
			const passwordHash = await bcrypt.hash(password, BCRYPT_COST);
			// Public registration intentionally fixes the role; elevated roles are provisioned out of band.
			const user = await UserModel.create({ name, email, password: passwordHash, role: 'student', studentId });
			return response.status(201).json({ success: true, user: toSafeUser(user) });
		} catch (error) {
			if (error.code === 11000) {
				return response.status(409).json({ success: false, message: 'An account with this email already exists.' });
			}
			return next(error);
		}
	});

	router.post('/login', async (request, response, next) => {
		const validation = validateLoginInput(request.body ?? {});
		if (validation.error) {
			return response.status(400).json({ success: false, message: validation.error });
		}

		try {
			const { email, password } = validation.value;
			const user = await UserModel.findOne({ email }).select('+password +tokenVersion');
			const validPassword = user ? await bcrypt.compare(password, user.password) : false;
			if (!validPassword) {
				return response.status(401).json({ success: false, message: 'Invalid email or password.' });
			}

			const token = jwt.sign(
				{ role: user.role, ver: user.tokenVersion },
				jwtSecret,
				{ algorithm: 'HS256', subject: String(user._id ?? user.id), expiresIn: TOKEN_LIFETIME },
			);
			// HttpOnly blocks JavaScript access; Lax is suitable for local same-site development,
			// while Secure is enabled in production. Cookie lifetime matches the JWT lifetime.
			response.cookie(AUTH_COOKIE_NAME, token, getAuthCookieOptions(env.nodeEnv));
			return response.json({ success: true, user: toSafeUser(user) });
		} catch (error) {
			return next(error);
		}
	});

	router.get('/me', authenticate, (request, response) => {
		return response.json({ success: true, user: toSafeUser(request.authenticatedUser) });
	});

	router.post('/logout', async (request, response, next) => {
		const token = request.cookies?.[AUTH_COOKIE_NAME];
		let revocationError;
		if (token) {
			try {
				const payload = jwt.verify(token, jwtSecret, { algorithms: ['HS256'] });
				const user = await UserModel.findById(payload.sub).select('+tokenVersion');
				if (user && user.tokenVersion === payload.ver) {
					user.tokenVersion += 1;
					await user.save();
				}
			} catch (error) {
				if (error.name !== 'JsonWebTokenError' && error.name !== 'TokenExpiredError' && error.name !== 'NotBeforeError') {
					revocationError = error;
				}
			}
		}

		response.clearCookie(AUTH_COOKIE_NAME, getClearCookieOptions(env.nodeEnv));
		if (revocationError) return next(revocationError);
		return response.json({ success: true, message: 'Logged out successfully.' });
	});

	return router;
}