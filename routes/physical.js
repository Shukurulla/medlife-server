const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const PhysicalActivity = require("../models/PhysicalActivity");

/**
 * @swagger
 * /api/physical:
 *   post:
 *     summary: Jismoniy faollik natijasini saqlash
 *     tags: [Physical Activity]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               distanceMeters:
 *                 type: number
 *               duration:
 *                 type: number
 *               date:
 *                 type: string
 *                 format: date
 *               startTime:
 *                 type: string
 *               endTime:
 *                 type: string
 *     responses:
 *       201:
 *         description: Natija saqlandi
 */
router.post("/", protect, async (req, res) => {
  try {
    const { distanceMeters, duration, date, startTime, endTime } = req.body;

    const activity = new PhysicalActivity({
      userId: req.user._id,
      distanceMeters,
      distanceKm: distanceMeters / 1000,
      duration,
      date,
      startTime,
      endTime,
    });

    await activity.save();
    res.status(201).json(activity);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Xatolik yuz berdi", error: error.message });
  }
});

/**
 * @swagger
 * /api/physical/stats:
 *   get:
 *     summary: Jismoniy faollik statistikasini olish
 *     tags: [Physical Activity]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [daily, weekly, monthly, yearly]
 *         required: true
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Statistika
 */
router.get("/stats", protect, async (req, res) => {
  try {
    const { period, date } = req.query;
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
    } else if (period === "yearly") {
      startDate = new Date(targetDate.getFullYear(), 0, 1);
      endDate = new Date(targetDate.getFullYear(), 11, 31, 23, 59, 59, 999);
    }

    const records = await PhysicalActivity.find({
      userId: req.user._id,
      date: { $gte: startDate, $lte: endDate },
    }).sort({ date: 1 });

    const totalDistance = records.reduce((sum, r) => sum + r.distanceMeters, 0);
    const totalDuration = records.reduce(
      (sum, r) => sum + (r.duration || 0),
      0
    );

    res.json({
      records,
      period,
      summary: {
        totalDistanceMeters: totalDistance,
        totalDistanceKm: totalDistance / 1000,
        totalDuration,
        averageDistancePerDay: totalDistance / Math.max(records.length, 1),
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Xatolik yuz berdi", error: error.message });
  }
});

module.exports = router;
