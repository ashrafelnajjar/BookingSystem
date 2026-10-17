require("dotenv").config();
const mongoose = require("mongoose");
const Availability = require("./src/models/availability");

const seed = async () => {
  await mongoose.connect(process.env.DB_URL);

  const existing = await Availability.findOne();
  if (existing) {
    console.log("Availability already exists, nothing to do.");
  } else {
    await Availability.create({
      openTime: "09:00",
      closeTime: "19:00",
      workingDays: [0, 1, 2, 3, 4], // الأحد → الخميس (0=الأحد ... 6=السبت)
    });
    console.log("Availability created.");
  }

  await mongoose.disconnect();
};

seed().catch((err) => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});