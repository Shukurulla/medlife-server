const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const User = require("../models/User");
const {
  getScreeningQuestions,
  evaluateScreening,
} = require("../utils/screening");

/**
 * @swagger
 * /api/screening/questions:
 *   get:
 *     summary: Skrining savollarini olish
 *     tags: [Screening]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Savollar ro'yxati
 */
router.get("/questions", protect, async (req, res) => {
  try {
    const questions = getScreeningQuestions(req.user.age);
    res.json({ questions });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Xatolik yuz berdi", error: error.message });
  }
});

/**
 * @swagger
 * /api/screening/submit:
 *   post:
 *     summary: Skrining natijalarini yuborish
 *     tags: [Screening]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               answers:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     questionId:
 *                       type: number
 *                     answer:
 *                       type: string
 *                       enum: [yes, no, unknown]
 *     responses:
 *       200:
 *         description: Skrining natijalari
 */
router.post("/submit", protect, async (req, res) => {
  try {
    const { answers } = req.body;

    const results = evaluateScreening(
      answers,
      req.user.age,
      req.user.weight,
      req.user.heightCm
    );

    const hasDiabetes = answers.find(
      (a) => a.questionId === 1 && a.answer === "yes"
    );

    await User.findByIdAndUpdate(req.user._id, {
      screeningResults: results.map((r) => ({
        disease: r.disease,
        risk: r.risk,
        doctorType: r.doctorType,
        createdAt: new Date(),
      })),
      hasDiabetes: !!hasDiabetes,
    });

    res.json({
      success: true,
      results,
      hasDiabetes: !!hasDiabetes,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Xatolik yuz berdi", error: error.message });
  }
});

/**
 * @swagger
 * /api/screening/appointment:
 *   post:
 *     summary: Shifokor uchrashuvini rejalashtirish
 *     tags: [Screening]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               resultIndex:
 *                 type: number
 *               appointmentDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Uchrashuv rejalashtirildi
 */
router.post("/appointment", protect, async (req, res) => {
  try {
    const { resultIndex, appointmentDate } = req.body;

    const user = await User.findById(req.user._id);
    if (user.screeningResults[resultIndex]) {
      user.screeningResults[resultIndex].appointmentDate = appointmentDate;
      await user.save();
    }

    res.json({ success: true });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Xatolik yuz berdi", error: error.message });
  }
});

/**
 * @swagger
 * /api/screening/visit-result:
 *   post:
 *     summary: Shifokor uchrashuvidan keyin natija kiritish
 *     tags: [Screening]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               resultIndex:
 *                 type: number
 *               visited:
 *                 type: boolean
 *               result:
 *                 type: string
 *               medications:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Natija saqlandi
 */
router.post("/visit-result", protect, async (req, res) => {
  try {
    const { resultIndex, visited, result, medications } = req.body;

    const user = await User.findById(req.user._id);
    if (user.screeningResults[resultIndex]) {
      user.screeningResults[resultIndex].visited = visited;
      user.screeningResults[resultIndex].result = result;
      user.screeningResults[resultIndex].medications = medications;
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
