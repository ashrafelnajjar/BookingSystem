const crypto = require("crypto");
const booking = require("../models/booking");
const sendEmail = require("../utils/sendEmail");
const { populate } = require("dotenv");

const HMAC_FIELDS = [
  "amount_cents",
  "created_at",
  "currency",
  "error_occured",
  "has_parent_transaction",
  "id",
  "integration_id",
  "is_3d_secure",
  "is_auth",
  "is_capture",
  "is_refunded",
  "is_standalone_payment",
  "is_voided",
  "order.id",
  "owner",
  "pending",
  "source_data.pan",
  "source_data.sub_type",
  "source_data.type",
  "success",
];

const getByPath = (obj, path) =>
  path.split(".").reduce((o, k) => (o == null ? o : o[k]), obj);

const verifyHmac = (obj, receivedHmac) => {
  const secret = process.env.PAYMOB_HMAC_SECRET;
  if (!secret) {

    return false;
  }

  const str = HMAC_FIELDS.map((f) => String(getByPath(obj, f))).join("");
  const calculated = crypto
    .createHmac("sha512", secret)
    .update(str)
    .digest("hex");

  const a = Buffer.from(calculated);
  const b = Buffer.from(String(receivedHmac || ""));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};

const paymobWebhook = async (req, res) => {
  const obj = req.body?.obj;

  if (!obj || !verifyHmac(obj, req.query.hmac)) {

    return res.status(401).json({ status: "fail" });
  }

  const ref = String(obj.order?.merchant_order_id || "");
  const match = ref.match(/^[0-9a-fA-F]{24}/);
  if (!match) {

    return res.sendStatus(200); 
  }
  const bookingId = match[0];

  if (obj.pending === true) return res.sendStatus(200);

  if (obj.success === true) {
    const confirmed = await booking
      .findOneAndUpdate(
        { _id: bookingId, status: "pending" },
        {
          status: "confirmed",
          paymentStatus: "paid",
          paymobOrderId: String(obj.order.id),
        },
        { returnDocument: "after" },
      )
      .populate("user", "email name");

    if (confirmed) {
      const paidAt = new Date().toLocaleString("en-GB", {
        timeZone: "Africa/Cairo",
      });
      const message = `
      <div style="direction: rtl; text-align: right; font-family: Arial;">
        <h2>Booking confirmation</h2>
        <p>payment received at ${paidAt}</p>
        <p>an appointment has been booked at the doctor #### 's clinic for ${confirmed.date} at ${confirmed.startTime}</p>
      </div>
    `;
      try {
        await sendEmail({
          to: confirmed.user.email,
          subject: "booking confirmation",
          html: message,
        });
      } catch(err) {
        console.error("Confirmation email failed:", err.message);
      }
    } else {
      const marked = await booking.findOneAndUpdate(
        { _id: bookingId, status: "cancelled", paymentStatus: "unpaid" },
        { paymentStatus: "paid", paymobOrderId: String(obj.order.id) },
      );
      if (marked) {
        console.warn(
          "PAID BUT BOOKING CANCELLED -> refund needed. booking:",
          bookingId,
          "paymob order:",
          obj.order.id,
        );
      }
    }
  } else {
    await booking.findOneAndUpdate(
      { _id: bookingId, status: "pending" },
      { status: "cancelled" },
    );
  }
  res.sendStatus(200);
};

module.exports = { paymobWebhook };
