import { Router } from 'express';
import { createAuthenticate } from '../middleware/authenticate.js';
import { requireRole } from '../middleware/requireRole.js';

export function createAdminRouter({ UserModel, jwtSecret }) {
	const router = Router();
	router.get('/dashboard', createAuthenticate({ UserModel, jwtSecret }), requireRole('admin'), (_request, response) => {
		response.json({ success: true, message: 'Admin dashboard access granted.' });
	});
	return router;
}