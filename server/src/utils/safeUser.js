export function toSafeUser(user) {
  return {
    id: String(user._id ?? user.id),
    name: user.name,
    email: user.email,
    role: user.role,
    studentId: user.studentId ?? null,
  };
}