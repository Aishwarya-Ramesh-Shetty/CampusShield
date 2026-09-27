export const AUTH_COOKIE_NAME = 'college_portal_auth';
export const AUTH_MAX_AGE_MS = 15 * 60 * 1000;

export function getAuthCookieOptions(nodeEnv) {
  return {
    httpOnly: true,
    secure: nodeEnv === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: AUTH_MAX_AGE_MS,
  };
}

export function getClearCookieOptions(nodeEnv) {
  const { maxAge: _maxAge, ...options } = getAuthCookieOptions(nodeEnv);
  return options;
}