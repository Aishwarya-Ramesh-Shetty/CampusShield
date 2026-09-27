import jwt from 'jsonwebtoken';
import { AUTH_COOKIE_NAME } from '../security/authCookie.js';

export function createAuthenticate({ UserModel, jwtSecret }) {
  return async function authenticate(request, response, next) {
    const token = request.cookies?.[AUTH_COOKIE_NAME];
    if (!token) {
      return response.status(401).json({ success: false, message: 'Authentication required.' });
    }

    let payload;
    try {
      payload = jwt.verify(token, jwtSecret, { algorithms: ['HS256'] });
    } catch {
      return response.status(401).json({ success: false, message: 'Authentication required.' });
    }

    try {
      const user = await UserModel.findById(payload.sub).select('+tokenVersion');
      if (!user || user.tokenVersion !== payload.ver) {
        return response.status(401).json({ success: false, message: 'Authentication required.' });
      }

      // Role comes from the current database record, not client input or a stale claim.
      request.authenticatedUser = user;
      request.user = { id: String(user._id ?? user.id), role: user.role };
      return next();
    } catch (error) {
      return next(error);
    }
  };
}