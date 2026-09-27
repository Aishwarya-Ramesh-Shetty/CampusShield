export function errorHandler(error, _request, response, _next) {
  const statusCode = error.status || error.statusCode || 500;
  const message = statusCode >= 500 ? 'An unexpected error occurred.' : error.message;

  response.status(statusCode).json({
    success: false,
    message,
  });
}