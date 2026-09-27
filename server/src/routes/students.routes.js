import { Router } from 'express';
import { createAuthenticate } from '../middleware/authenticate.js';
import { requireRole } from '../middleware/requireRole.js';

export function createStudentsRouter({ UserModel, jwtSecret }) {
	const router = Router();
	router.get('/dashboard', createAuthenticate({ UserModel, jwtSecret }), requireRole('student'), (_request, response) => {
		response.json({ success: true, message: 'Student dashboard access granted.' });
	});
	return router;
}