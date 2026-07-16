const asyncHandler = require("express-async-handler");
const Course = require("../models/Course");
const User = require("../models/User");
const Session = require("../models/Session");
const Attendance = require("../models/Attendance");

// @desc  Admin creates a course
// @route POST /api/courses
const createCourse = asyncHandler(async (req, res) => {
  const { name, code, department, academicYear, semester, teacherId, studentIds, schedule } = req.body;

  if (!name || !code || !academicYear || !semester || !teacherId) {
    res.status(400);
    throw new Error("name, code, academicYear, semester and teacherId are required");
  }

  const teacher = await User.findById(teacherId);
  if (!teacher || teacher.role !== "teacher") {
    res.status(400);
    throw new Error("Invalid teacher ID");
  }

  const course = await Course.create({
    name,
    code,
    department,
    academicYear,
    semester,
    teacher: teacherId,
    students: studentIds || [],
    schedule: schedule || [],
    createdBy: req.user._id,
  });

  await course.populate([
    { path: "teacher", select: "name email" },
    { path: "students", select: "name email" },
  ]);

  res.status(201).json(course);
});

// @desc  Get all courses (admin)
// @route GET /api/courses
const getAllCourses = asyncHandler(async (req, res) => {
  const courses = await Course.find()
    .populate("teacher", "name email")
    .populate("students", "name email")
    .populate("createdBy", "name")
    .sort({ createdAt: -1 });
  res.json(courses);
});

// @desc  Get courses for logged-in teacher
// @route GET /api/courses/my
const getMyCourses = asyncHandler(async (req, res) => {
  const courses = await Course.find({ teacher: req.user._id, isActive: true })
    .populate("students", "name email avatar")
    .sort({ createdAt: -1 });
  res.json(courses);
});

// @desc  Get courses for logged-in student
// @route GET /api/courses/enrolled
const getEnrolledCourses = asyncHandler(async (req, res) => {
  const courses = await Course.find({ students: req.user._id, isActive: true })
    .populate("teacher", "name email avatar")
    .sort({ createdAt: -1 });
  res.json(courses);
});

// @desc  Get single course
// @route GET /api/courses/:id
const getCourse = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id)
    .populate("teacher", "name email avatar")
    .populate("students", "name email avatar");

  if (!course) {
    res.status(404);
    throw new Error("Course not found");
  }

  res.json(course);
});

// @desc  Update course (admin)
// @route PUT /api/courses/:id
const updateCourse = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) {
    res.status(404);
    throw new Error("Course not found");
  }

  const { name, code, department, academicYear, semester, teacherId, studentIds, schedule, isActive } = req.body;

  if (name) course.name = name;
  if (code) course.code = code;
  if (department !== undefined) course.department = department;
  if (academicYear) course.academicYear = academicYear;
  if (semester) course.semester = semester;
  if (teacherId) course.teacher = teacherId;
  if (studentIds) course.students = studentIds;
  if (schedule) course.schedule = schedule;
  if (isActive !== undefined) course.isActive = isActive;

  await course.save();
  await course.populate([
    { path: "teacher", select: "name email" },
    { path: "students", select: "name email" },
  ]);

  res.json(course);
});

// @desc  Add students to course (admin)
// @route PATCH /api/courses/:id/students
const addStudents = asyncHandler(async (req, res) => {
  const { studentIds } = req.body;
  const course = await Course.findById(req.params.id);

  if (!course) {
    res.status(404);
    throw new Error("Course not found");
  }

  // Merge without duplicates
  const existing = course.students.map((s) => s.toString());
  const toAdd = studentIds.filter((id) => !existing.includes(id));
  course.students.push(...toAdd);
  await course.save();
  await course.populate("students", "name email");

  res.json({ message: `${toAdd.length} student(s) added`, students: course.students });
});

// @desc  Remove student from course (admin)
// @route DELETE /api/courses/:id/students/:studentId
const removeStudent = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) {
    res.status(404);
    throw new Error("Course not found");
  }

  course.students = course.students.filter(
    (s) => s.toString() !== req.params.studentId
  );
  await course.save();

  res.json({ message: "Student removed" });
});

// @desc  Delete course (admin)
// @route DELETE /api/courses/:id
const deleteCourse = asyncHandler(async (req, res) => {
  const course = await Course.findByIdAndDelete(req.params.id);
  if (!course) {
    res.status(404);
    throw new Error("Course not found");
  }
  res.json({ message: "Course deleted" });
});

// @desc  Get attendance report for a course
// @route GET /api/courses/:id/attendance
const getCourseAttendance = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id).populate("students", "name email avatar");
  if (!course) {
    res.status(404);
    throw new Error("Course not found");
  }

  // Only teacher of this course or admin can view
  if (
    course.teacher.toString() !== req.user._id.toString() &&
    req.user.role !== "admin"
  ) {
    res.status(403);
    throw new Error("Access denied");
  }

  // Get all sessions for this course
  const sessions = await Session.find({ course: req.params.id }).sort({ createdAt: 1 });
  const sessionIds = sessions.map((s) => s._id);
  const totalSessions = sessions.length;

  // Get all attendance records for these sessions
  const records = await Attendance.find({
    session: { $in: sessionIds },
    status: "present",
  });

  // Build per-student summary
  const studentSummary = course.students.map((student) => {
    const attended = records.filter(
      (r) => r.student.toString() === student._id.toString()
    ).length;
    const percentage = totalSessions > 0 ? Math.round((attended / totalSessions) * 100) : 0;
    return {
      student: { _id: student._id, name: student.name, email: student.email, avatar: student.avatar },
      attended,
      totalSessions,
      percentage,
      belowThreshold: percentage < 75,
    };
  });

  res.json({
    course: { name: course.name, code: course.code },
    totalSessions,
    studentSummary,
    sessions: sessions.map((s) => ({ _id: s._id, subject: s.subject, createdAt: s.createdAt })),
  });
});

module.exports = {
  createCourse,
  getAllCourses,
  getMyCourses,
  getEnrolledCourses,
  getCourse,
  updateCourse,
  addStudents,
  removeStudent,
  deleteCourse,
  getCourseAttendance,
};
