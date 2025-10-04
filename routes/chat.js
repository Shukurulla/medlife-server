const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const { chatWithAI } = require("../services/openai");

/**
 * @swagger
 * /api/chat:
 *   post:
 *     summary: AI bilan chat qilish (tashxis)
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               symptoms:
 *                 type: string
 *     responses:
 *       200:
 *         description: AI javobi
 */
router.post("/", protect, async (req, res) => {
  try {
    const { symptoms } = req.body;

    if (!symptoms || symptoms.trim().length === 0) {
      return res.status(400).json({ message: "Semptomlarni kiriting" });
    }

    const response = await chatWithAI(
      symptoms,
      req.user.age,
      req.user.hasDiabetes
    );

    const disclaimer =
      "\n\n⚠️ MUHIM: Bu AI tashxis bo'lib, 100% aniq emas. Albatta shifokorga ko'rining!";

    res.json({
      response: response + disclaimer,
      timestamp: new Date(),
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Xatolik yuz berdi", error: error.message });
  }
});

module.exports = router;
