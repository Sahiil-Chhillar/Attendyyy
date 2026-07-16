const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    session: { type: mongoose.Schema.Types.ObjectId, ref: "Session", required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    markedAt: { type: Date, default: Date.now },
    studentLat: { type: Number },
    studentLng: { type: Number },
    distance: { type: Number },
    status: { type: String, enum: ["present", "rejected"], default: "present" },
  },
  { timestamps: true }
);

attendanceSchema.index({ session: 1, student: 1 }, { unique: true });

module.exports = mongoose.model("Attendance", attendanceSchema);
