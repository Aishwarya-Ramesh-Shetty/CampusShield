import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    subjectCode: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    totalClasses: {
      type: Number,
      required: true,
      min: 0,
    },
    attendedClasses: {
      type: Number,
      required: true,
      min: 0,
    },
    attendancePercentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    semester: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
  },
  { timestamps: true },
);

const Attendance = mongoose.model('Attendance', attendanceSchema);

export default Attendance;
