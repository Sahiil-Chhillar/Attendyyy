// const express = require("express");
// const router = express.Router();
// const {
//   createCourse,
//   getAllCourses,
//   getMyCourses,
//   getEnrolledCourses,
//   getCourse,
//   updateCourse,
//   addStudents,
//   removeStudent,
//   deleteCourse,
//   getCourseAttendance,
// } = require("../controllers/courseController");
// const { protect } = require("../middleware/authMiddleware");
// const roleMiddleware = require("../middleware/roleMiddleware");

// // Student
// router.get("/enrolled", protect, roleMiddleware("student"), getEnrolledCourses);

// // Teacher
// router.get("/my", protect, roleMiddleware("teacher", "admin"), getMyCourses);
// router.get("/:id/attendance", protect, roleMiddleware("teacher", "admin"), getCourseAttendance);

// // Admin only
// router.post("/", protect, roleMiddleware("admin"), createCourse);
// router.get("/", protect, roleMiddleware("admin"), getAllCourses);
// router.put("/:id", protect, roleMiddleware("admin"), updateCourse);
// router.patch("/:id/students", protect, roleMiddleware("admin"), addStudents);
// router.delete("/:id/students/:studentId", protect, roleMiddleware("admin"), removeStudent);
// router.delete("/:id", protect, roleMiddleware("admin"), deleteCourse);

// // Shared (teacher + admin)
// router.get("/:id", protect, roleMiddleware("teacher", "admin", "student"), getCourse);

// module.exports = router;

const express = require("express");
const router = express.Router();
const {
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
} = require("../controllers/courseController");
const { protect } = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

// ── Specific named routes FIRST (before /:id) ──────────────────────────────
router.get("/enrolled", protect, roleMiddleware("student"), getEnrolledCourses);
router.get("/my", protect, roleMiddleware("teacher", "admin"), getMyCourses);

// ── Admin CRUD ──────────────────────────────────────────────────────────────
router.post("/", protect, roleMiddleware("admin"), createCourse);
router.get("/", protect, roleMiddleware("admin"), getAllCourses);

// ── Param routes LAST (/:id catches everything above if placed first) ───────
router.get(
  "/:id/attendance",
  protect,
  roleMiddleware("teacher", "admin"),
  getCourseAttendance,
);
router.get(
  "/:id",
  protect,
  roleMiddleware("teacher", "admin", "student"),
  getCourse,
);
router.put("/:id", protect, roleMiddleware("admin"), updateCourse);
router.patch("/:id/students", protect, roleMiddleware("admin"), addStudents);
router.delete(
  "/:id/students/:studentId",
  protect,
  roleMiddleware("admin"),
  removeStudent,
);
router.delete("/:id", protect, roleMiddleware("admin"), deleteCourse);

module.exports = router;