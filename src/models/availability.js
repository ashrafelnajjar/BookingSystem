const mongoose = require("mongoose");

const availablDaysSchema = new mongoose.Schema({
  workingDays: { type: [Number], enum: [1, 2, 3, 4] },
  openTime: {
    type: String,
    required: true,
    default: "09:00",
  },
  closeTime: {
    type: String,
    required: true,
    default: "20:00",
  },
  session: {
    type: Number,
    default: 60,
  },
});

const available = mongoose.model("availablDays", availablDaysSchema);
module.exports = available;
