const express = require("express");
const router = express.Router();
const {
  getAvailableSlot,
  createBooking,
  cancelBooking,
  updateBooking,
  getBooking,
  getBookingById
} = require("../controllers/booking");
const joivalidation = require("../middlewares/joi-validation")
const {getAvailableSlotsSchema, createBookingSchema, updateBookingSchema,cancelBookingSchema,getBookingSchema} = require("../validator/booking")
const auth = require("../middlewares/auth")

router.get("/available-slots",auth ,joivalidation(getAvailableSlotsSchema),getAvailableSlot)
router.post("/" ,auth, joivalidation(createBookingSchema),createBooking)
router.patch("/:id" ,auth, joivalidation(updateBookingSchema),updateBooking)
router.patch("/:id/cancel" ,auth, joivalidation(cancelBookingSchema),cancelBooking)
router.get("/:id" ,auth,joivalidation(cancelBookingSchema), getBookingById)
router.get("/" ,auth , joivalidation(getBookingSchema), getBooking)


module.exports = router
