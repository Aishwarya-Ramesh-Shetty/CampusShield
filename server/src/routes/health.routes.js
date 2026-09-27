import { Router } from 'express';

export function createHealthRouter() {
  const router = Router();
  router.get('/', (_request, response) => {
    response.json({ success: true, status: 'ok', message: 'Backend is running.' });
  });
  return router;
}