const mongoose = require("mongoose");

const scheduleSchema = new mongoose.Schema({
  day: {
    type: String,
    enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    required: true,
  },
  time: { type: String, required: true }, // e.g. "10:00"
  room: { type: String, default: "" },
});

const courseSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true },
    department: { type: String, default: "" },
    academicYear: { type: String, required: true }, // e.g. "2024-25"
    semester: { type: String, enum: ["Odd", "Even"], required: true },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    students: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    schedule: [scheduleSchema],
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Course", courseSchema);
