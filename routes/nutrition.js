const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const Nutrition = require("../models/Nutrition");
const { analyzeFoodImage } = require("../services/clarifai");
const {
  analyzeFoodFeedback,
  analyzeFoodImageWithVision,
} = require("../services/openai");

router.post("/analyze", protect, async (req, res) => {
  try {
    const { image } = req.body;

    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");

    // OpenAI Vision API ishlatish
    const analysis = await analyzeFoodImageWithVision(base64Data);

    const feedback = await analyzeFoodFeedback(
      analysis.foodName,
      analysis.sugarContent,
      req.user.hasDiabetes
    );

    let status = "normal";
    if (analysis.sugarContent > 20) status = "danger";
    else if (analysis.sugarContent > 10) status = "warning";

    res.json({
      ...analysis,
      feedback,
      status,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Xatolik yuz berdi", error: error.message });
  }
});

/**
 * @swagger
 * /api/nutrition/analyze:
 *   post:
 *     summary: Ovqat rasmini tahlil qilish
 *     tags: [Nutrition]
 *     security:
 *       - bearerAuth: []
 */
router.post("/analyze", protect, async (req, res) => {
  try {
    const { image } = req.body;

    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
    const analysis = await analyzeFoodImage(base64Data);

    const feedback = await analyzeFoodFeedback(
      analysis.foodName,
      analysis.sugarContent,
      req.user.hasDiabetes
    );

    let status = "normal";
    if (analysis.sugarContent > 20) status = "danger";
    else if (analysis.sugarContent > 10) status = "warning";

    res.json({
      ...analysis,
      feedback,
      status,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Xatolik yuz berdi", error: error.message });
  }
});

/**
 * @swagger
 * /api/nutrition:
 *   post:
 *     summary: Ovqatlanish ma'lumotini saqlash
 *     tags: [Nutrition]
 *     security:
 *       - bearerAuth: []
 */
router.post("/", protect, async (req, res) => {
  try {
    const { mealType, date, foods } = req.body;

    const totalSugar = foods.reduce((sum, f) => sum + (f.sugarContent || 0), 0);
    const totalCalories = foods.reduce((sum, f) => sum + (f.calories || 0), 0);

    const nutrition = new Nutrition({
      userId: req.user._id,
      mealType,
      date,
      foods,
      totalSugar,
      totalCalories,
    });

    await nutrition.save();
    res.status(201).json(nutrition);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Xatolik yuz berdi", error: error.message });
  }
});

/**
 * @swagger
 * /api/nutrition:
 *   get:
 *     summary: Ovqatlanish tarixini olish
 *     tags: [Nutrition]
 *     security:
 *       - bearerAuth: []
 */
router.get("/", protect, async (req, res) => {
  try {
    const { date, period } = req.query;
    const targetDate = date ? new Date(date) : new Date();

    let startDate, endDate;

    if (period === "daily") {
      startDate = new Date(targetDate.setHours(0, 0, 0, 0));
      endDate = new Date(targetDate.setHours(23, 59, 59, 999));
    } else if (period === "weekly") {
      const day = targetDate.getDay();
      startDate = new Date(targetDate);
      startDate.setDate(targetDate.getDate() - day);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
    } else if (period === "monthly") {
      startDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
      endDate = new Date(
        targetDate.getFullYear(),
        targetDate.getMonth() + 1,
        0,
        23,
        59,
        59,
        999
      );
    }

    const nutrition = await Nutrition.find({
      userId: req.user._id,
      date: { $gte: startDate, $lte: endDate },
    }).sort({ date: -1 });

    res.json(nutrition);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Xatolik yuz berdi", error: error.message });
  }
});

/**
 * @swagger
 * /api/nutrition/{id}:
 *   delete:
 *     summary: Ovqatlanish yozuvini o'chirish
 *     tags: [Nutrition]
 *     security:
 *       - bearerAuth: []
 */
router.delete("/:id", protect, async (req, res) => {
  try {
    await Nutrition.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    res.json({ success: true });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Xatolik yuz berdi", error: error.message });
  }
});

module.exports = router;
