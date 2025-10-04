const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const User = require("../models/User");

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Foydalanuvchi ro'yxatdan o'tkazish
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - gender
 *               - birthDate
 *               - weight
 *               - height
 *               - region
 *               - phone
 *               - password
 *               - language
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               gender:
 *                 type: string
 *                 enum: [male, female]
 *               birthDate:
 *                 type: string
 *                 format: date
 *               weight:
 *                 type: number
 *               height:
 *                 type: number
 *               region:
 *                 type: string
 *               phone:
 *                 type: string
 *               password:
 *                 type: string
 *               language:
 *                 type: string
 *                 enum: [uz, ru, kaa]
 *               invitedBy:
 *                 type: string
 *     responses:
 *       201:
 *         description: Ro'yxatdan o'tish muvaffaqiyatli
 */
router.post("/register", async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      gender,
      birthDate,
      weight,
      height,
      region,
      phone,
      password,
      language,
      invitedBy,
    } = req.body;

    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "Bu telefon raqam allaqachon ro'yxatdan o'tgan" });
    }

    let heightM, heightCm;
    if (height < 10) {
      heightM = height;
      heightCm = height * 100;
    } else {
      heightCm = height;
      heightM = height / 100;
    }

    const user = new User({
      firstName,
      lastName,
      gender,
      birthDate,
      weight,
      heightM,
      heightCm,
      region,
      phone,
      password,
      language,
      invitedBy: invitedBy || null,
    });

    await user.save();

    if (invitedBy) {
      await User.findByIdAndUpdate(invitedBy, {
        $push: { familyMembers: user._id },
      });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "30d",
    });

    res.status(201).json({
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        language: user.language,
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Xatolik yuz berdi", error: error.message });
  }
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Foydalanuvchi tizimga kirish
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone
 *               - password
 *             properties:
 *               phone:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Tizimga kirish muvaffaqiyatli
 */
router.post("/login", async (req, res) => {
  try {
    const { phone, password } = req.body;

    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(401).json({ message: "Telefon raqam yoki parol xato" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Telefon raqam yoki parol xato" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "30d",
    });

    res.json({
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        language: user.language,
        hasDiabetes: user.hasDiabetes,
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Xatolik yuz berdi", error: error.message });
  }
});

module.exports = router;
