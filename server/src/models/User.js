import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
      match: [/^\$2[aby]\$\d{2}\$/, 'Password must be bcrypt-hashed before storage.'],
    },
    role: {
      type: String,
      enum: ['student', 'admin', 'security_assessor'],
      default: 'student',
      required: true,
    },
    studentId: {
      type: String,
      trim: true,
    },
    tokenVersion: {
      type: Number,
      default: 0,
      select: false,
    },
  },
  { timestamps: true },
);

const User = mongoose.model('User', userSchema);

export default User;