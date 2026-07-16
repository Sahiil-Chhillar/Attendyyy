const express = require("express");
const router = express.Router();
const { createSession, getMySessions, getSession, deactivateSession } = require("../controllers/qrController");
const { protect } = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

router.post("/create", protect, roleMiddleware("teacher", "admin"), createSession);
router.get("/sessions", protect, roleMiddleware("teacher", "admin"), getMySessions);
router.get("/sessions/:id", protect, roleMiddleware("teacher", "admin"), getSession);
router.patch("/sessions/:id/deactivate", protect, roleMiddleware("teacher", "admin"), deactivateSession);

module.exports = router;
