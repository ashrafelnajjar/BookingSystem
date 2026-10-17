const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
    name: { type: String, required: true, minlength: 3 },
    phone: { type: String, required: true },
    date: {
      type: String, // صيغة YYYY-MM-DD لتجنب مشاكل المناطق الزمنية Timezone
      required: true,
    },
    startTime: {
      type: String, // "10:00"
      required: true,
    },
    description: {
      type: String,
      required: true,
    },

    paymentStatus: {
      type: String,
      enum: ["unpaid", "paid"],
      default: "unpaid",
    },
    paymentMethod: {
      type: String,
      enum: ["online", "onsite"],
      required: true,
    },
    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
    },
    status: {
      type: String,
      enum: ["confirmed", "cancelled" , "pending" , "finished"],
      default: "pending",
    },
    paymobOrderId :{
      type: String,
    }
  },
  { timestamps: true },
);
bookingSchema.index(
  { date: 1, startTime: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: ["confirmed", "pending"] } },
  },
);

const booking = mongoose.model("Booking", bookingSchema);
module.exports = booking;
