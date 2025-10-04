const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  gender: { type: String, enum: ["male", "female"], required: true },
  birthDate: { type: Date, required: true },
  age: { type: Number },
  weight: { type: Number, required: true },
  heightM: { type: Number, required: true },
  heightCm: { type: Number, required: true },
  region: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  language: { type: String, enum: ["uz", "ru", "kaa"], default: "uz" },

  hasDiabetes: { type: Boolean, default: false },

  screeningResults: [
    {
      disease: String,
      risk: String,
      doctorType: String,
      appointmentDate: Date,
      visited: Boolean,
      result: String,
      medications: [String],
      createdAt: { type: Date, default: Date.now },
    },
  ],

  invitedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },

  familyMembers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

  notifications: [
    {
      type: String,
      message: String,
      read: { type: Boolean, default: false },
      createdAt: { type: Date, default: Date.now },
    },
  ],

  createdAt: { type: Date, default: Date.now },
});

// Age calculation
userSchema.pre("save", function (next) {
  if (this.birthDate) {
    const today = new Date();
    const birth = new Date(this.birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      age--;
    }
    this.age = age;
  }
  next();
});

// Password hashing
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
