import { Router } from 'express';
import { createAuthenticate } from '../middleware/authenticate.js';
import { requireRole } from '../middleware/requireRole.js';

export function createStudentsRouter({
	UserModel,
	StudentModel,
	MarkModel,
	AttendanceModel,
	FeeModel,
	NoticeModel,
	jwtSecret,
}) {
	const router = Router();
	const authenticate = createAuthenticate({ UserModel, jwtSecret });

	async function resolveStudentFromAuth(request) {
		if (!request.user || !request.user.id) {
			return null;
		}

		return StudentModel.findOne({ user: request.user.id });
	}

	router.get('/dashboard', authenticate, requireRole('student'), async (request, response, next) => {
		try {
			const student = await resolveStudentFromAuth(request);
			if (!student) {
				return response.status(404).json({ success: false, message: 'Student profile not found.' });
			}

			const [marks, attendance, fees, notices] = await Promise.all([
				MarkModel.find({ student: student._id }).sort({ createdAt: -1 }),
				AttendanceModel.find({ student: student._id }).sort({ createdAt: -1 }),
				FeeModel.find({ student: student._id }).sort({ createdAt: -1 }),
				NoticeModel.find({ isActive: true }).sort({ publishedAt: -1 }).limit(10),
			]);

			return response.json({
				success: true,
				data: {
					profile: {
						id: String(student._id ?? student.id),
						studentId: student.studentId,
						name: student.name,
						email: student.email,
						course: student.course,
						department: student.department,
						year: student.year,
						semester: student.semester,
						division: student.division,
						phone: student.phone,
						admissionYear: student.admissionYear,
					},
					marks,
					attendance,
					fees,
					notices,
				},
			});
		} catch (error) {
			return next(error);
		}
	});

	router.get('/profile', authenticate, requireRole('student'), async (request, response, next) => {
		try {
			const student = await resolveStudentFromAuth(request);
			if (!student) {
				return response.status(404).json({ success: false, message: 'Student profile not found.' });
			}
			return response.json({ success: true, data: { ...student.toObject ? student.toObject() : student } });
		} catch (error) {
			return next(error);
		}
	});

	router.get('/marks', authenticate, requireRole('student'), async (request, response, next) => {
		try {
			const student = await resolveStudentFromAuth(request);
			if (!student) {
				return response.status(404).json({ success: false, message: 'Student profile not found.' });
			}
			const marks = await MarkModel.find({ student: student._id }).sort({ semester: 1, subject: 1 });
			return response.json({ success: true, data: marks });
		} catch (error) {
			return next(error);
		}
	});

	router.get('/attendance', authenticate, requireRole('student'), async (request, response, next) => {
		try {
			const student = await resolveStudentFromAuth(request);
			if (!student) {
				return response.status(404).json({ success: false, message: 'Student profile not found.' });
			}
			const attendance = await AttendanceModel.find({ student: student._id }).sort({ semester: 1, subject: 1 });
			return response.json({ success: true, data: attendance });
		} catch (error) {
			return next(error);
		}
	});

	router.get('/fees', authenticate, requireRole('student'), async (request, response, next) => {
		try {
			const student = await resolveStudentFromAuth(request);
			if (!student) {
				return response.status(404).json({ success: false, message: 'Student profile not found.' });
			}
			const fees = await FeeModel.find({ student: student._id }).sort({ academicYear: -1, semester: 1 });
			return response.json({ success: true, data: fees });
		} catch (error) {
			return next(error);
		}
	});

	router.get('/notices', authenticate, requireRole('student'), async (_request, response, next) => {
		try {
			const notices = await NoticeModel.find({ isActive: true }).sort({ publishedAt: -1 });
			return response.json({ success: true, data: notices });
		} catch (error) {
			return next(error);
		}
	});

	return router;
}