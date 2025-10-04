const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const Medication = require("../models/Medication");

/**
 * @swagger
 * /api/medication:
 *   post:
 *     summary: Dori qo'shish
 *     tags: [Medication]
 *     security:
 *       - bearerAuth: []
 */
router.post("/", protect, async (req, res) => {
  try {
    const { name, dosage, times, reminderEnabled } = req.body;

    const medication = new Medication({
      userId: req.user._id,
      name,
      dosage,
      times,
      reminderEnabled,
    });

    await medication.save();
    res.status(201).json(medication);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Xatolik yuz berdi", error: error.message });
  }
});

/**
 * @swagger
 * /api/medication:
 *   get:
 *     summary: Barcha dorilarni olish
 *     tags: [Medication]
 *     security:
 *       - bearerAuth: []
 */
router.get("/", protect, async (req, res) => {
  try {
    const medications = await Medication.find({
      userId: req.user._id,
      active: true,
    }).sort({ createdAt: -1 });

    res.json(medications);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Xatolik yuz berdi", error: error.message });
  }
});

/**
 * @swagger
 * /api/medication/{id}/take:
 *   post:
 *     summary: Dori ichganini belgilash
 *     tags: [Medication]
 *     security:
 *       - bearerAuth: []
 */
router.post("/:id/take", protect, async (req, res) => {
  try {
    const { time, date } = req.body;

    const medication = await Medication.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!medication) {
      return res.status(404).json({ message: "Dori topilmadi" });
    }

    medication.takenRecords.push({
      date: date || new Date(),
      time,
      taken: true,
      takenAt: new Date(),
    });

    await medication.save();
    res.json(medication);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Xatolik yuz berdi", error: error.message });
  }
});

/**
 * @swagger
 * /api/medication/{id}:
 *   put:
 *     summary: Dorini tahrirlash
 *     tags: [Medication]
 *     security:
 *       - bearerAuth: []
 */
router.put("/:id", protect, async (req, res) => {
  try {
    const { name, dosage, times, reminderEnabled } = req.body;

    const medication = await Medication.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { name, dosage, times, reminderEnabled },
      { new: true }
    );

    if (!medication) {
      return res.status(404).json({ message: "Dori topilmadi" });
    }

    res.json(medication);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Xatolik yuz berdi", error: error.message });
  }
});

/**
 * @swagger
 * /api/medication/{id}:
 *   delete:
 *     summary: Dorini o'chirish
 *     tags: [Medication]
 *     security:
 *       - bearerAuth: []
 */
router.delete("/:id", protect, async (req, res) => {
  try {
    await Medication.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { active: false }
    );

    res.json({ success: true });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Xatolik yuz berdi", error: error.message });
  }
});

/**
 * @swagger
 * /api/medication/stats:
 *   get:
 *     summary: Dori qabul qilish statistikasi
 *     tags: [Medication]
 *     security:
 *       - bearerAuth: []
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
    }

    const medications = await Medication.find({
      userId: req.user._id,
      active: true,
    });

    const stats = medications.map((med) => {
      const records = med.takenRecords.filter(
        (r) => new Date(r.date) >= startDate && new Date(r.date) <= endDate
      );

      const taken = records.filter((r) => r.taken).length;
      const missed = records.filter((r) => !r.taken).length;

      return {
        medicationId: med._id,
        name: med.name,
        taken,
        missed,
        total: taken + missed,
        adherence: (taken / (taken + missed)) * 100 || 0,
      };
    });

    res.json({ stats, period });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Xatolik yuz berdi", error: error.message });
  }
});

module.exports = router;
