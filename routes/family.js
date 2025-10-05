const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const User = require("../models/User");
const Glucometer = require("../models/Glucometer");
const PhysicalActivity = require("../models/PhysicalActivity");
const Medication = require("../models/Medication");
const Nutrition = require("../models/Nutrition");
const QRCode = require("qrcode");

router.get("/invite", protect, async (req, res) => {
  try {
    const inviteUrl = `${
      process.env.FRONTEND_URL || "https://med-life-client.vercel.app"
    }/register?invitedBy=${req.user._id}`;

    const qrCode = await QRCode.toDataURL(inviteUrl);

    res.json({
      qrCode,
      inviteUrl,
      userId: req.user._id,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Xatolik yuz berdi", error: error.message });
  }
});

router.get("/members", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate({
        path: "familyMembers",
        select:
          "firstName lastName age gender hasDiabetes screeningResults phone region weight heightCm",
      })
      .lean();

    if (!user) {
      return res.status(404).json({ message: "Foydalanuvchi topilmadi" });
    }

    let allMembers = user.familyMembers || [];

    const invitedUsers = await User.find({ invitedBy: req.user._id })
      .select(
        "firstName lastName age gender hasDiabetes screeningResults phone region weight heightCm"
      )
      .lean();

    if (user.invitedBy) {
      const inviter = await User.findById(user.invitedBy)
        .select(
          "firstName lastName age gender hasDiabetes screeningResults phone region weight heightCm"
        )
        .lean();
      if (
        inviter &&
        !allMembers.some((m) => m._id.toString() === inviter._id.toString())
      ) {
        allMembers.push(inviter);
      }
    }

    invitedUsers.forEach((invitedUser) => {
      if (
        !allMembers.some((m) => m._id.toString() === invitedUser._id.toString())
      ) {
        allMembers.push(invitedUser);
      }
    });

    res.json({
      members: allMembers,
      total: allMembers.length,
    });
  } catch (error) {
    console.error("Family members error:", error);
    res
      .status(500)
      .json({ message: "Xatolik yuz berdi", error: error.message });
  }
});

// YANGI ENDPOINT - Oila a'zosining to'liq ma'lumotlari
router.get("/member/:id", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    const isInvitedByUser = await User.findOne({
      _id: req.params.id,
      invitedBy: req.user._id,
    });

    const isInviter =
      user.invitedBy && user.invitedBy.toString() === req.params.id;

    const isFamilyMember = user.familyMembers.some(
      (memberId) => memberId.toString() === req.params.id
    );

    if (!isFamilyMember && !isInvitedByUser && !isInviter) {
      return res.status(403).json({ message: "Ruxsat yo'q" });
    }

    // To'liq ma'lumotlarni olish (DoctorPatient kabi)
    const patient = await User.findById(req.params.id)
      .select("-password")
      .lean();

    if (!patient) {
      return res.status(404).json({ message: "Foydalanuvchi topilmadi" });
    }

    const glucometerData = await Glucometer.find({ userId: req.params.id })
      .sort({ date: -1 })
      .limit(30)
      .lean();

    const physicalData = await PhysicalActivity.find({
      userId: req.params.id,
    })
      .sort({ date: -1 })
      .limit(30)
      .lean();

    const medications = await Medication.find({
      userId: req.params.id,
      active: true,
    }).lean();

    const nutritionData = await Nutrition.find({ userId: req.params.id })
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
