const mongoose = require("mongoose");

const nutritionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  mealType: {
    type: String,
    enum: ["breakfast", "lunch", "dinner", "snack"],
    required: true,
  },
  date: { type: Date, required: true },

  foods: [
    {
      image: { type: String, required: true },
      foodName: { type: String },
      sugarContent: { type: Number },
      calories: { type: Number },
      carbs: { type: Number },
      feedback: { type: String },
      status: { type: String, enum: ["normal", "warning", "danger"] },
    },
  ],

  totalSugar: { type: Number, default: 0 },
  totalCalories: { type: Number, default: 0 },

  createdAt: { type: Date, default: Date.now },
});

nutritionSchema.index({ userId: 1, date: -1 });

module.exports = mongoose.model("Nutrition", nutritionSchema);
