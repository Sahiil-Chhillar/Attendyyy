const asyncHandler = require("express-async-handler");
const crypto = require("crypto");
const User = require("../models/User");
const generateToken = require("../utils/generateToken");
const generateOTP = require("../utils/generateOTP");
const sendEmail = require("../utils/sendEmail");

// @desc  Register + send OTP
// @route POST /api/auth/register
const register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error("Please fill all fields");
  }

  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error("Email already registered");
  }

  const { otp, otpExpiry } = generateOTP();

  const user = await User.create({
    name,
    email,
    password,
    role: role || "student",
    otp,
    otpExpiry,
  });

  await sendEmail({
    to: email,
    subject: "Verify your Attendyy account",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;border-radius:8px;border:1px solid #e5e7eb">
        <h2 style="color:#4f46e5">Welcome to Attendyy!</h2>
        <p>Your verification OTP is:</p>
        <div style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#4f46e5;text-align:center;padding:16px;background:#f5f3ff;border-radius:8px">${otp}</div>
        <p style="color:#6b7280;margin-top:16px">This OTP expires in <strong>10 minutes</strong>. Do not share it with anyone.</p>
      </div>
    `,
  });

  res.status(201).json({ message: "Registered. Check your email for OTP." });
});

// @desc  Verify OTP
// @route POST /api/auth/verify-otp
const verifyOTP = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  const user = await User.findOne({ email });

  if (!user || user.otp !== otp) {
    res.status(400);
    throw new Error("Invalid OTP");
  }

  if (user.otpExpiry < Date.now()) {
    res.status(400);
    throw new Error("OTP expired. Please request a new one.");
  }

  user.isVerified = true;
  user.otp = undefined;
  user.otpExpiry = undefined;
  await user.save();

  res.json({ message: "Email verified successfully. You can now log in." });
});

// @desc  Resend OTP
// @route POST /api/auth/resend-otp
const resendOTP = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    res.status(404);
    throw new Error("No user with that email");
  }

  if (user.isVerified) {
    res.status(400);
    throw new Error("Account already verified");
  }

  const { otp, otpExpiry } = generateOTP();
  user.otp = otp;
  user.otpExpiry = otpExpiry;
  await user.save();

  await sendEmail({
    to: email,
    subject: "Attendyy - New OTP",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;border-radius:8px;border:1px solid #e5e7eb">
        <h2 style="color:#4f46e5">New OTP</h2>
        <div style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#4f46e5;text-align:center;padding:16px;background:#f5f3ff;border-radius:8px">${otp}</div>
        <p style="color:#6b7280;margin-top:16px">Expires in <strong>10 minutes</strong>.</p>
      </div>
    `,
  });

  res.json({ message: "New OTP sent to your email." });
});

// @desc  Login
// @route POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error("Invalid email or password");
  }

  if (!user.isVerified) {
    res.status(403);
    throw new Error("Please verify your email first");
  }

  res.json({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
    token: generateToken(user._id, user.role),
  });
});

// @desc  Forgot password
// @route POST /api/auth/forgot-password
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    res.status(404);
    throw new Error("No user with that email");
  }

  const resetToken = crypto.randomBytes(32).toString("hex");
  user.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
  user.resetPasswordExpiry = Date.now() + 15 * 60 * 1000;
  await user.save();

  const resetURL = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

  await sendEmail({
    to: email,
    subject: "Attendyy - Password Reset",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;border-radius:8px;border:1px solid #e5e7eb">
        <h2 style="color:#4f46e5">Reset Your Password</h2>
        <p>Click the button below to reset your password. This link expires in <strong>15 minutes</strong>.</p>
        <a href="${resetURL}" style="display:inline-block;margin-top:16px;padding:12px 24px;background:#4f46e5;color:#fff;text-decoration:none;border-radius:6px;font-weight:bold">Reset Password</a>
        <p style="margin-top:16px;color:#6b7280;font-size:12px">If you did not request this, please ignore this email.</p>
      </div>
    `,
  });

  res.json({ message: "Password reset link sent to email" });
});

// @desc  Reset password
// @route POST /api/auth/reset-password/:token
const resetPassword = asyncHandler(async (req, res) => {
  const hashedToken = crypto.createHash("sha256").update(req.params.token).digest("hex");

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpiry: { $gt: Date.now() },
  });

  if (!user) {
    res.status(400);
    throw new Error("Invalid or expired reset token");
  }

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpiry = undefined;
  await user.save();

  res.json({ message: "Password reset successful. You can now log in." });
});

// @desc  Upload avatar
// @route POST /api/auth/avatar
const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error("No file uploaded");
  }
  req.user.avatar = req.file.path;
  await req.user.save();
  res.json({ avatar: req.user.avatar });
});

// @desc  Get own profile
// @route GET /api/auth/me
const getMe = asyncHandler(async (req, res) => {
  res.json(req.user);
});

// @desc  Update profile
// @route PUT /api/auth/me
const updateMe = asyncHandler(async (req, res) => {
  const { name, proficiency } = req.body;
  req.user.name = name || req.user.name;
  if (proficiency !== undefined) req.user.proficiency = proficiency;
  await req.user.save();
  res.json({
    name: req.user.name,
    email: req.user.email,
    avatar: req.user.avatar,
    proficiency: req.user.proficiency,
  });
});

module.exports = { register, verifyOTP, resendOTP, login, forgotPassword, resetPassword, uploadAvatar, getMe, updateMe };
