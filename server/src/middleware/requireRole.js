export function requireRole(role) {
  return function authorize(request, response, next) {
    if (!request.user) {
      return response.status(401).json({ success: false, message: 'Authentication required.' });
    }
    if (request.user.role !== role) {
      return response.status(403).json({ success: false, message: 'You do not have permission to access this resource.' });
    }
    return next();
  };
}