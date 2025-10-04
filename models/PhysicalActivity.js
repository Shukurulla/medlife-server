const mongoose = require("mongoose");

const physicalActivitySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  distanceMeters: { type: Number, required: true },
  distanceKm: { type: Number, required: true },
  duration: { type: Number },
  date: { type: Date, required: true },
  startTime: { type: String },
  endTime: { type: String },
  createdAt: { type: Date, default: Date.now },
});

physicalActivitySchema.index({ userId: 1, date: -1 });

module.exports = mongoose.model("PhysicalActivity", physicalActivitySchema);
