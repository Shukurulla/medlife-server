const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Glucometer = require("../models/Glucometer");
const PhysicalActivity = require("../models/PhysicalActivity");
const Medication = require("../models/Medication");
const Nutrition = require("../models/Nutrition");
const QRCode = require("qrcode");

/**
 * @swagger
 * /api/doctor/patient-qr/{userId}:
 *   get:
 *     summary: Bemor uchun QR kod yaratish
 *     tags: [Doctor]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 */
router.get("/patient-qr/:userId", async (req, res) => {
  try {
    const patientUrl = `${
      process.env.FRONTEND_URL || "http://localhost:5173"
    }/doctor/patient/${req.params.userId}`;

    const qrCode = await QRCode.toDataURL(patientUrl);

    res.json({
      qrCode,
      patientUrl,
      patientId: req.params.userId,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Xatolik yuz berdi", error: error.message });
  }
});

/**
 * @swagger
 * /api/doctor/patient/{userId}:
 *   get:
 *     summary: Bemor ma'lumotlarini olish
 *     tags: [Doctor]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 */
router.get("/patient/:userId", async (req, res) => {
  try {
    const patient = await User.findById(req.params.userId)
      .select("-password")
      .lean();

    if (!patient) {
      return res.status(404).json({ message: "Bemor topilmadi" });
    }

    const glucometerData = await Glucometer.find({ userId: req.params.userId })
      .sort({ date: -1 })
      .limit(30)
      .lean();

    const physicalData = await PhysicalActivity.find({
      userId: req.params.userId,
    })
      .sort({ date: -1 })
      .limit(30)
      .lean();

    const medications = await Medication.find({
      userId: req.params.userId,
      active: true,
    }).lean();

    const nutritionData = await Nutrition.find({ userId: req.params.userId })
      .sort({ date: -1 })
      .limit(30)
      .lean();

    const avgGlucose =
      glucometerData.length > 0
        ? glucometerData.reduce((sum, g) => sum + g.value, 0) /
          glucometerData.length
        : 0;

    const totalDistance = physicalData.reduce(
      (sum, p) => sum + p.distanceKm,
      0
    );

    const avgCalories =
      nutritionData.length > 0
        ? nutritionData.reduce((sum, n) => sum + n.totalCalories, 0) /
          nutritionData.length
        : 0;

    res.json({
      patient,
      glucometerData,
      physicalData,
      medications,
      nutritionData,
      summary: {
        averageGlucose: avgGlucose.toFixed(1),
        totalDistanceKm: totalDistance.toFixed(2),
        averageCalories: avgCalories.toFixed(0),
        medicationCount: medications.length,
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Xatolik yuz berdi", error: error.message });
  }
});

module.exports = router;
