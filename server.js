require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./utils/swagger");
const cron = require("node-cron");
const {
  sendMedicationReminders,
  sendWeatherNotifications,
} = require("./services/notification");
const User = require("./models/User");

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/users", require("./routes/users"));
app.use("/api/screening", require("./routes/screening"));
app.use("/api/glucometer", require("./routes/glucometer"));
app.use("/api/physical", require("./routes/physical"));
app.use("/api/medication", require("./routes/medication"));
app.use("/api/nutrition", require("./routes/nutrition"));
app.use("/api/family", require("./routes/family"));
app.use("/api/chat", require("./routes/chat"));
app.use("/api/doctor", require("./routes/doctor"));

// Swagger Documentation
app.use("/rest/doc", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Cron Jobs
// Har 10 daqiqada dori eslatmalarini yuborish
cron.schedule("*/10 * * * *", () => {
  sendMedicationReminders();
});

// Har kuni 08:00 da ob-havo eslatmalarini yuborish
cron.schedule("0 8 * * *", () => {
  sendWeatherNotifications();
});

app.get("/users", async (req, res) => {
  try {
    const user = await User.find();
    res.json({ data: user });
  } catch (error) {
    res.json({ error });
  }
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Server xatosi", error: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
