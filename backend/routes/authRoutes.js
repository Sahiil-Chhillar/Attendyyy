const express = require("express");
const router = express.Router();
const {
  register, verifyOTP, resendOTP, login,
  forgotPassword, resetPassword,
  uploadAvatar, getMe, updateMe,
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const { upload } = require("../config/cloudinary");

router.post("/register", register);
router.post("/verify-otp", verifyOTP);
router.post("/resend-otp", resendOTP);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);
router.post("/avatar", protect, upload.single("avatar"), uploadAvatar);
router.get("/me", protect, getMe);
router.put("/me", protect, updateMe);

module.exports = router;
