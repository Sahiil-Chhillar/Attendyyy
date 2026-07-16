const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const Session = require("../models/Session");
const Attendance = require("../models/Attendance");
const Course = require("../models/Course");

// @desc  Get all users
// @route GET /api/admin/users
const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select("-password").sort({ createdAt: -1 });
  res.json(users);
});

// @desc  Update user role
// @route PATCH /api/admin/users/:id/role
const updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  if (!["student", "teacher", "admin"].includes(role)) {
    res.status(400);
    throw new Error("Invalid role");
  }
  const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select("-password");
  if (!user) { res.status(404); throw new Error("User not found"); }
  res.json(user);
});

// @desc  Delete user
// @route DELETE /api/admin/users/:id
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) { res.status(404); throw new Error("User not found"); }
  res.json({ message: "User deleted" });
});

// @desc  Get all sessions
// @route GET /api/admin/sessions
const getAllSessions = asyncHandler(async (req, res) => {
  const sessions = await Session.find()
    .populate("teacher", "name email")
    .populate("course", "name code")
    .sort({ createdAt: -1 });
  res.json(sessions);
});

// @desc  Dashboard stats
// @route GET /api/admin/stats
const getStats = asyncHandler(async (req, res) => {
  const [totalUsers, totalSessions, totalPresent, totalRejected, students, teachers, totalCourses] =
    await Promise.all([
      User.countDocuments(),
      Session.countDocuments(),
      Attendance.countDocuments({ status: "present" }),
      Attendance.countDocuments({ status: "rejected" }),
      User.countDocuments({ role: "student" }),
      User.countDocuments({ role: "teacher" }),
      Course.countDocuments(),
    ]);
  res.json({ totalUsers, totalSessions, totalPresent, totalRejected, students, teachers, totalCourses });
});

module.exports = { getAllUsers, updateUserRole, deleteUser, getAllSessions, getStats };
