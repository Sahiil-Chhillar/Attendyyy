const express = require("express");
const router = express.Router();
const { markAttendance, getSessionAttendance, getMyAttendance } = require("../controllers/attendanceController");
const { protect } = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

router.post("/mark", protect, roleMiddleware("student"), markAttendance);
router.get("/session/:sessionId", protect, roleMiddleware("teacher", "admin"), getSessionAttendance);
router.get("/my", protect, roleMiddleware("student"), getMyAttendance);

module.exports = router;
