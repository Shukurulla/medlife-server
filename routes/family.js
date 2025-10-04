const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const User = require("../models/User");
const QRCode = require("qrcode");

/**
 * @swagger
 * /api/family/invite:
 *   get:
 *     summary: Oila a'zosini qo'shish uchun QR kod olish
 *     tags: [Family]
 *     security:
 *       - bearerAuth: []
 */
router.get("/invite", protect, async (req, res) => {
  try {
    const inviteUrl = `${
      process.env.FRONTEND_URL || "http://localhost:5173"
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

/**
 * @swagger
 * /api/family/members:
 *   get:
 *     summary: Oila a'zolari ro'yxatini olish
 *     tags: [Family]
 *     security:
 *       - bearerAuth: []
 */
router.get("/members", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate("familyMembers", "-password")
      .lean();

    res.json({
      members: user.familyMembers || [],
      total: user.familyMembers?.length || 0,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Xatolik yuz berdi", error: error.message });
  }
});

/**
 * @swagger
 * /api/family/member/{id}:
 *   get:
 *     summary: Oila a'zosining batafsil ma'lumotini olish
 *     tags: [Family]
 *     security:
 *       - bearerAuth: []
 */
router.get("/member/:id", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user.familyMembers.includes(req.params.id)) {
      return res.status(403).json({ message: "Ruxsat yo'q" });
    }

    const member = await User.findById(req.params.id)
      .select("-password")
      .lean();

    res.json(member);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Xatolik yuz berdi", error: error.message });
  }
});

module.exports = router;
