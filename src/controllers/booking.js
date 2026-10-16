const booking = require("../models/booking");
const available = require("../models/availability");
const AppError = require("../utils/AppError");
const { createPaymentLink, PAYMENT_WINDOW_MS } = require("../services/paymob");
 
// الحجز بيعتبر "شاغل الميعاد" وهو pending (في صفحة الدفع) أو confirmed
const ACTIVE = ["pending", "confirmed"];
 
const timeToMinutes = (timeStr) => {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
};
 
const minutesToTime = (totalMinutes) => {
  const hours = Math.floor(totalMinutes / 60)
    .toString()
    .padStart(2, "0");
  const minutes = (totalMinutes % 60).toString().padStart(2, "0");
  return `${hours}:${minutes}`;
};
 
// يلغي الحجوزات الأونلاين اللي ما اتدفعتش في المدة المحددة
const releaseExpiredPending = () =>
  booking.updateMany(
    {
      status: "pending",
      createdAt: { $lt: new Date(Date.now() - PAYMENT_WINDOW_MS) },
    },
    { status: "cancelled" },
  );
 
// يتحقق من التاريخ ويوم العمل ويرجّع إعدادات العمل
const getConfigForDate = async (date) => {
  const todayInCairo = new Date().toLocaleDateString("en-CA", {
    timeZone: "Africa/Cairo",
  });
  if (date <= todayInCairo) {
    throw new AppError("Booking must be at least one day in advance", 400);
  }
 
  const config = await available.findOne();
  if (!config) throw new AppError("Availability not configured", 500);
 
  const dayOfWeek = new Date(date).getUTCDay();
  if (!config.workingDays.includes(dayOfWeek)) {
    throw new AppError(
      "This day is an official holiday outside of working days",
      400,
    );
  }
  return config;
};
 
// يتحقق إن الوقت جوه ساعات العمل وعلى حدود الساعة
const assertValidTime = (config, startTime) => {
  const appointment = timeToMinutes(startTime);
  const openTime = timeToMinutes(config.openTime);
  const closeTime = timeToMinutes(config.closeTime);
  if (
    appointment < openTime ||
    appointment + 60 > closeTime ||
    (appointment - openTime) % 60 !== 0
  ) {
    throw new AppError(
      "The chosen appointment is outside the scope of official working hours",
      400,
    );
  }
};
 
const getAvailableSlot = async (req, res) => {
  const { date } = req.query;
  const config = await getConfigForDate(date);
  await releaseExpiredPending();
 
  const start = timeToMinutes(config.openTime);
  const end = timeToMinutes(config.closeTime);
 
  const allSlots = [];
  for (let current = start; current + 60 <= end; current += 60) {
    allSlots.push({ startTime: minutesToTime(current) });
  }
 
  const taken = await booking.find({ date, status: { $in: ACTIVE } });
  const takenTimes = taken.map((b) => b.startTime);
 
  const availableSlots = allSlots.filter(
    (slot) => !takenTimes.includes(slot.startTime),
  );
 
  res.status(200).json({
    status: "success",
    date,
    results: availableSlots.length,
    availableSlots,
  });
};
 
const createBooking = async (req, res) => {
  const { date, startTime, name, phone, description, paymentMethod } = req.body;
 
  const config = await getConfigForDate(date);
  assertValidTime(config, startTime);
  await releaseExpiredPending();
 
  const isTaken = await booking.findOne({
    date,
    startTime,
    status: { $in: ACTIVE },
  });
  if (isTaken) throw new AppError("this appointment is already booked", 409);
 
  // الـ unique index هو الحماية الحقيقية من الـ race condition (الـ errorHandler بيمسك 11000)
  const newBooking = await booking.create({
    user: req.user._id,
    name,
    phone,
    description,
    date,
    startTime,
    paymentMethod,
    status: paymentMethod === "on_site" ? "confirmed" : "pending",
  });
 
  if (paymentMethod === "on_site") {
    return res
      .status(201)
      .json({ status: "success", data: { booking: newBooking } });
  }
 
  let paymentUrl;
  try {
    paymentUrl = await createPaymentLink(newBooking, req.user);
  } catch (err) {
    newBooking.status = "cancelled"; // الدفع ما بدأش، حرّر الميعاد
    await newBooking.save();
    throw err;
  }
 
  res.status(201).json({
    status: "success",
    data: {
      booking: newBooking,
      paymentUrl,
      expiresAt: new Date(Date.now() + PAYMENT_WINDOW_MS),
    },
  });
};
 
const updateBooking = async (req, res) => {
  const { name, phone, description, date, startTime } = req.body;
 
  const book = await booking.findById(req.params.id);
  if (!book) throw new AppError("there is no booking under this id", 404);
 
  if (
    req.user.role !== "admin" &&
    book.user.toString() !== req.user._id.toString()
  ) {
    throw new AppError("you are not authorized to update this booking", 403);
  }
  if (book.status === "cancelled") {
    throw new AppError("cannot update a cancelled booking", 400);
  }
 
  if (book.status === "pending") {
    throw new AppError("cannot update a unpaid booking", 400);
  }
 
  const newDate = date ?? book.date;
  const newStartTime = startTime ?? book.startTime;
 
  if (newDate !== book.date || newStartTime !== book.startTime) {
    const config = await getConfigForDate(newDate);
    assertValidTime(config, newStartTime);
    await releaseExpiredPending();
 
    const isTaken = await booking.findOne({
      _id: { $ne: book._id },
      date: newDate,
      startTime: newStartTime,
      status: { $in: ACTIVE },
    });
    if (isTaken) throw new AppError("this appointment is already booked", 409);
  }
 
  const changes = { name, phone, description, date: newDate, startTime: newStartTime };
  Object.keys(changes).forEach((k) => changes[k] === undefined && delete changes[k]);
 
  const updated = await booking.findByIdAndUpdate(req.params.id, changes, {
    new: true,
    runValidators: true,
  });
 
  res.status(200).json({ status: "success", data: { booking: updated } });
};
 
const cancelBooking = async (req, res) => {
  const book = await booking.findById(req.params.id);
  if (!book) throw new AppError("there is no booking under this id", 404);
 
  if (
    req.user.role !== "admin" &&
    book.user.toString() !== req.user._id.toString()
  ) {
    throw new AppError("you are not authorized to cancel this booking", 403);
  }
  if (book.status === "cancelled") {
    throw new AppError("this booking is already cancelled", 400);
  }
  if (book.paymentStatus === "paid") {
    throw new AppError(" a paid booking can't be cancelled", 400);
  }
 
  book.status = "cancelled";
  await book.save();
 
  res.status(200).json({ status: "success", data: { booking: book } });
};
 
module.exports = {
  getAvailableSlot,
  createBooking,
  updateBooking,
  cancelBooking,
};
 