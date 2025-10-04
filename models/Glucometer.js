const mongoose = require("mongoose");

const glucometerSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  value: { type: Number, required: true },
  date: { type: Date, required: true },
  time: { type: String, required: true },
  note: { type: String },
  createdAt: { type: Date, default: Date.now },
});

glucometerSchema.index({ userId: 1, date: -1 });

module.exports = mongoose.model("Glucometer", glucometerSchema);
