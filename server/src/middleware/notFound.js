export function notFound(request, response) {
  response.status(404).json({
    success: false,
    message: `No route found for ${request.method} ${request.originalUrl}`,
  });
}