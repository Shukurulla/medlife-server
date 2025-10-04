const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const Glucometer = require("../models/Glucometer");

/**
 * @swagger
 * /api/glucometer:
 *   post:
 *     summary: Glukometr natijasini qo'shish
 *     tags: [Glucometer]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               value:
 *                 type: number
 *               date:
 *                 type: string
 *                 format: date
 *               time:
 *                 type: string
 *               note:
 *                 type: string
 *     responses:
 *       201:
 *         description: Natija qo'shildi
 */
router.post("/", protect, async (req, res) => {
  try {
    const { value, date, time, note } = req.body;

    const glucometer = new Glucometer({
      userId: req.user._id,
      value,
      date,
      time,
      note,
    });

    await glucometer.save();
    res.status(201).json(glucometer);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Xatolik yuz berdi", error: error.message });
  }
});

/**
 * @swagger
 * /api/glucometer/stats:
 *   get:
 *     summary: Glukometr statistikasini olish
 *     tags: [Glucometer]
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

    const records = await Glucometer.find({
      userId: req.user._id,
      date: { $gte: startDate, $lte: endDate },
    }).sort({ date: 1, time: 1 });

    res.json({ records, period });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Xatolik yuz berdi", error: error.message });
  }
});

/**
 * @swagger
 * /api/glucometer/{id}:
 *   delete:
 *     summary: Glukometr natijasini o'chirish
 *     tags: [Glucometer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: O'chirildi
 */
router.delete("/:id", protect, async (req, res) => {
  try {
    await Glucometer.findOneAndDelete({
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
