const mongoose = require("mongoose");

const medicationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String, required: true },
  dosage: { type: String },
  times: [{ type: String, required: true }],
  reminderEnabled: { type: Boolean, default: false },

  takenRecords: [
    {
      date: { type: Date, required: true },
      time: { type: String, required: true },
      taken: { type: Boolean, required: true },
      takenAt: { type: Date },
    },
  ],

  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

medicationSchema.index({ userId: 1, active: 1 });

module.exports = mongoose.model("Medication", medicationSchema);
