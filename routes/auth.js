const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const User = require("../models/User");

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

    // MUHIM: Ikki tomonlama bog'lanish
    if (invitedBy) {
      // Taklif qilgan odamga yangi foydalanuvchini qo'shish
      await User.findByIdAndUpdate(invitedBy, {
        $addToSet: { familyMembers: user._id },
      });

      // Yangi foydalanuvchiga taklif qilgan odamni qo'shish
      await User.findByIdAndUpdate(user._id, {
        $addToSet: { familyMembers: invitedBy },
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
