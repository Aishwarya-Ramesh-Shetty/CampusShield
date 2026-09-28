import mongoose from 'mongoose';

const markSchema = new mongoose.Schema(
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
    internalMarks: {
      type: Number,
      required: true,
      min: 0,
      max: 40,
    },
    externalMarks: {
      type: Number,
      required: true,
      min: 0,
      max: 60,
    },
    totalMarks: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    grade: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
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

const Mark = mongoose.model('Mark', markSchema);

export default Mark;
