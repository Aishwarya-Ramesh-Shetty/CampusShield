import { Router } from 'express';
import { createAuthenticate } from '../middleware/authenticate.js';
import { requireRole } from '../middleware/requireRole.js';

export function createAdminRouter({
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

	router.get('/dashboard', authenticate, requireRole('admin'), async (_request, response, next) => {
		try {
			const [totalStudents, activeNotices, recentStudents, recentNotices] = await Promise.all([
				StudentModel.countDocuments(),
				NoticeModel.countDocuments({ isActive: true }),
				StudentModel.find().sort({ createdAt: -1 }).limit(5),
				NoticeModel.find().sort({ publishedAt: -1 }).limit(5),
			]);

			return response.json({
				success: true,
				data: {
					totalStudents,
					totalActiveNotices: activeNotices,
					recentStudents,
					recentNotices,
				},
			});
		} catch (error) {
			return next(error);
		}
	});

	router.get('/students', authenticate, requireRole('admin'), async (_request, response, next) => {
		try {
			const students = await StudentModel.find().sort({ createdAt: -1 });
			return response.json({
				success: true,
				data: {
					totalStudents: students.length,
					students,
				},
			});
		} catch (error) {
			return next(error);
		}
	});

	router.get('/students/:studentId', authenticate, requireRole('admin'), async (request, response, next) => {
		try {
			const student = await StudentModel.findById(request.params.studentId);
			if (!student) {
				return response.status(404).json({ success: false, message: 'Student not found.' });
			}

			const [marks, attendance, fees] = await Promise.all([
				MarkModel.find({ student: student._id }).sort({ semester: 1, subject: 1 }),
				AttendanceModel.find({ student: student._id }).sort({ semester: 1, subject: 1 }),
				FeeModel.find({ student: student._id }).sort({ academicYear: -1, semester: 1 }),
			]);

			return response.json({
				success: true,
				data: {
					student,
					marks,
					attendance,
					fees,
				},
			});
		} catch (error) {
			return next(error);
		}
	});

	router.get('/notices', authenticate, requireRole('admin'), async (_request, response, next) => {
		try {
			const notices = await NoticeModel.find().sort({ publishedAt: -1 });
			return response.json({ success: true, data: notices });
		} catch (error) {
			return next(error);
		}
	});

	router.post('/notices', authenticate, requireRole('admin'), async (request, response, next) => {
		try {
			const { title, description, category, expiresAt } = request.body ?? {};
			if (!title || !description || !category) {
				return response.status(400).json({ success: false, message: 'Title, description, and category are required.' });
			}

			const noticePayload = {
				title: String(title).trim(),
				description: String(description).trim(),
				category: String(category).trim(),
				createdBy: 'admin',
				publishedAt: new Date(),
				expiresAt: expiresAt ? new Date(expiresAt) : null,
				isActive: true,
			};

			const notice = await NoticeModel.create(noticePayload);

			return response.status(201).json({ success: true, data: notice });
		} catch (error) {
			return next(error);
		}
	});

	router.put('/notices/:noticeId', authenticate, requireRole('admin'), async (request, response, next) => {
		try {
			const notice = await NoticeModel.findById(request.params.noticeId);
			if (!notice) {
				return response.status(404).json({ success: false, message: 'Notice not found.' });
			}

			const { title, description, category, expiresAt, isActive } = request.body ?? {};
			if (title !== undefined) notice.title = String(title).trim();
			if (description !== undefined) notice.description = String(description).trim();
			if (category !== undefined) notice.category = String(category).trim();
			if (expiresAt !== undefined) notice.expiresAt = expiresAt ? new Date(expiresAt) : null;
			if (isActive !== undefined) notice.isActive = Boolean(isActive);

			await notice.save();
			return response.json({ success: true, data: notice });
		} catch (error) {
			return next(error);
		}
	});

	router.delete('/notices/:noticeId', authenticate, requireRole('admin'), async (request, response, next) => {
		try {
			const notice = await NoticeModel.findById(request.params.noticeId);
			if (!notice) {
				return response.status(404).json({ success: false, message: 'Notice not found.' });
			}

			notice.isActive = false;
			await notice.save();
			return response.json({ success: true, message: 'Notice deactivated successfully.' });
		} catch (error) {
			return next(error);
		}
	});

	return router;
}