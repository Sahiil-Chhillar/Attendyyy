const asyncHandler = require("express-async-handler");
const Session = require("../models/Session");
const Attendance = require("../models/Attendance");
const haversine = require("../utils/haversine");

// @desc  Mark attendance
// @route POST /api/attendance/mark
const markAttendance = asyncHandler(async (req, res) => {
  const { qrToken, latitude, longitude } = req.body;

  if (!qrToken || latitude == null || longitude == null) {
    res.status(400);
    throw new Error("qrToken, latitude and longitude are required");
  }

  const session = await Session.findOne({ qrToken });
  if (!session) {
    res.status(404);
    throw new Error("Invalid QR code");
  }

  if (!session.isActive || session.expiresAt < Date.now()) {
    res.status(400);
    throw new Error("QR code has expired");
  }

  const alreadyMarked = await Attendance.findOne({
    session: session._id,
    student: req.user._id,
  });
  if (alreadyMarked) {
    res.status(400);
    throw new Error("Attendance already marked for this session");
  }

  const distance = haversine(session.latitude, session.longitude, latitude, longitude);

  if (distance > session.radiusMeters) {
    await Attendance.create({
      session: session._id,
      student: req.user._id,
      studentLat: latitude,
      studentLng: longitude,
      distance: Math.round(distance),
      status: "rejected",
    });

    res.status(403);
    throw new Error(
      `You are ${Math.round(distance)}m away. Must be within ${session.radiusMeters}m.`
    );
  }

  await Attendance.create({
    session: session._id,
    student: req.user._id,
    studentLat: latitude,
    studentLng: longitude,
    distance: Math.round(distance),
    status: "present",
  });

  res.status(201).json({
    message: "Attendance marked successfully",
    distance: Math.round(distance),
    status: "present",
    subject: session.subject,
  });
});

// @desc  Get attendance for a session (teacher/admin)
// @route GET /api/attendance/session/:sessionId
const getSessionAttendance = asyncHandler(async (req, res) => {
  const session = await Session.findById(req.params.sessionId);

  if (!session) {
    res.status(404);
    throw new Error("Session not found");
  }

  if (
    session.teacher.toString() !== req.user._id.toString() &&
    req.user.role !== "admin"
  ) {
    res.status(403);
    throw new Error("Access denied");
  }

  const records = await Attendance.find({ session: req.params.sessionId })
    .populate("student", "name email avatar")
    .sort({ markedAt: 1 });

  res.json({
    session: { subject: session.subject, expiresAt: session.expiresAt },
    total: records.length,
    present: records.filter((r) => r.status === "present").length,
    rejected: records.filter((r) => r.status === "rejected").length,
    records,
  });
});

// @desc  Student - own attendance history
// @route GET /api/attendance/my
const getMyAttendance = asyncHandler(async (req, res) => {
  const records = await Attendance.find({ student: req.user._id })
    .populate({ path: "session", select: "subject expiresAt teacher", populate: { path: "teacher", select: "name" } })
    .sort({ createdAt: -1 });

  res.json(records);
});

module.exports = { markAttendance, getSessionAttendance, getMyAttendance };
