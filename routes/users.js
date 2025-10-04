const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const User = require("../models/User");

/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     summary: Foydalanuvchi profilini olish
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
router.get("/profile", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    res.json(user);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Xatolik yuz berdi", error: error.message });
  }
});

/**
 * @swagger
 * /api/users/profile:
 *   put:
 *     summary: Profilni yangilash
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
router.put("/profile", protect, async (req, res) => {
  try {
    const { firstName, lastName, weight, height, region, language } = req.body;

    const updateData = {
      firstName,
      lastName,
      weight,
      region,
      language,
    };

    if (height) {
      if (height < 10) {
        updateData.heightM = height;
        updateData.heightCm = height * 100;
      } else {
        updateData.heightCm = height;
        updateData.heightM = height / 100;
      }
    }

    const user = await User.findByIdAndUpdate(req.user._id, updateData, {
      new: true,
    }).select("-password");

    res.json(user);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Xatolik yuz berdi", error: error.message });
  }
});

/**
 * @swagger
 * /api/users/notifications:
 *   get:
 *     summary: Bildirishnomalarni olish
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
router.get("/notifications", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("notifications");
    res.json(user.notifications.sort((a, b) => b.createdAt - a.createdAt));
  } catch (error) {
    res
      .status(500)
      .json({ message: "Xatolik yuz berdi", error: error.message });
  }
});

/**
 * @swagger
 * /api/users/notifications/{id}/read:
 *   put:
 *     summary: Bildirishnomani o'qilgan deb belgilash
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
router.put("/notifications/:id/read", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const notification = user.notifications.id(req.params.id);

    if (notification) {
      notification.read = true;
      await user.save();
    }

    res.json({ success: true });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Xatolik yuz berdi", error: error.message });
  }
});

module.exports = router;
