const asyncHandler = require("express-async-handler");
const { v4: uuidv4 } = require("uuid");
const QRCode = require("qrcode");
const Session = require("../models/Session");
const Course = require("../models/Course");

// @desc  Create session + QR (optionally linked to a course)
// @route POST /api/qr/create
const createSession = asyncHandler(async (req, res) => {
  const { subject, latitude, longitude, radiusMeters, durationMinutes, courseId } = req.body;

  if (!subject || latitude == null || longitude == null) {
    res.status(400);
    throw new Error("subject, latitude and longitude are required");
  }

  // If courseId provided, verify teacher owns it
  if (courseId) {
    const course = await Course.findById(courseId);
    if (!course) {
      res.status(404);
      throw new Error("Course not found");
    }
    if (course.teacher.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      res.status(403);
      throw new Error("Not your course");
    }
  }

  const qrToken = uuidv4();
  const expiresAt = new Date(Date.now() + (durationMinutes || 15) * 60 * 1000);
  const qrData = JSON.stringify({ qrToken, expiresAt });
  const qrCodeUrl = await QRCode.toDataURL(qrData);

  const session = await Session.create({
    teacher: req.user._id,
    course: courseId || null,
    subject,
    qrToken,
    qrCodeUrl,
    latitude,
    longitude,
    radiusMeters: radiusMeters || 100,
    expiresAt,
  });

  res.status(201).json({
    sessionId: session._id,
    qrCodeUrl,
    expiresAt,
    subject,
    radiusMeters: session.radiusMeters,
    courseId: session.course,
  });
});

// @desc  Get all sessions for this teacher
// @route GET /api/qr/sessions
const getMySessions = asyncHandler(async (req, res) => {
  const sessions = await Session.find({ teacher: req.user._id })
    .populate("course", "name code")
    .sort({ createdAt: -1 });
  res.json(sessions);
});

// @desc  Get one session
// @route GET /api/qr/sessions/:id
const getSession = asyncHandler(async (req, res) => {
  const session = await Session.findById(req.params.id).populate("course", "name code");
  if (!session) {
    res.status(404);
    throw new Error("Session not found");
  }
  if (session.teacher.toString() !== req.user._id.toString() && req.user.role !== "admin") {
    res.status(403);
    throw new Error("Not your session");
  }
  res.json(session);
});

// @desc  Deactivate session
// @route PATCH /api/qr/sessions/:id/deactivate
const deactivateSession = asyncHandler(async (req, res) => {
  const session = await Session.findById(req.params.id);
  if (!session) {
    res.status(404);
    throw new Error("Session not found");
  }
  if (session.teacher.toString() !== req.user._id.toString() && req.user.role !== "admin") {
    res.status(403);
    throw new Error("Not your session");
  }
  session.isActive = false;
  await session.save();
  res.json({ message: "Session deactivated" });
});

module.exports = { createSession, getMySessions, getSession, deactivateSession };
