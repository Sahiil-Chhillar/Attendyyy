const express = require("express");
const router = express.Router();
const { getAllUsers, updateUserRole, deleteUser, getAllSessions, getStats } = require("../controllers/adminController");
const { protect } = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

router.use(protect, roleMiddleware("admin"));

router.get("/users", getAllUsers);
router.patch("/users/:id/role", updateUserRole);
router.delete("/users/:id", deleteUser);
router.get("/sessions", getAllSessions);
router.get("/stats", getStats);

module.exports = router;
