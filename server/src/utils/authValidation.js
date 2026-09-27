const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_PASSWORD_BYTES = 72;

export function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

export function validateRegistrationInput(body) {
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const email = typeof body.email === 'string' ? normalizeEmail(body.email) : '';
  const password = typeof body.password === 'string' ? body.password : '';
  const studentId = typeof body.studentId === 'string' ? body.studentId.trim() : '';

  if (name.length < 2 || name.length > 100) {
    return { error: 'Name must be between 2 and 100 characters.' };
  }
  if (email.length > 254 || !EMAIL_PATTERN.test(email)) {
    return { error: 'Enter a valid email address.' };
  }
  if (password.length < 12 || Buffer.byteLength(password, 'utf8') > MAX_PASSWORD_BYTES) {
    return { error: 'Password must be at least 12 characters and no more than 72 bytes.' };
  }
  if (!studentId || studentId.length > 40) {
    return { error: 'Student ID is required and must be 40 characters or fewer.' };
  }

  return { value: { name, email, password, studentId } };
}

export function validateLoginInput(body) {
  const email = typeof body.email === 'string' ? normalizeEmail(body.email) : '';
  const password = typeof body.password === 'string' ? body.password : '';

  if (email.length > 254 || !EMAIL_PATTERN.test(email) || !password || Buffer.byteLength(password, 'utf8') > MAX_PASSWORD_BYTES) {
    return { error: 'Enter a valid email address and password.' };
  }

  return { value: { email, password } };
}