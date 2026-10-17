const AppError = require("../utils/AppError");
 

const PAYMENT_WINDOW_MS = 10 * 60 * 1000; 
const PAYMENT_WINDOW_SECONDS = PAYMENT_WINDOW_MS / 1000;
 
const createPaymentLink = async (booking, user) => {
  const amountCents = Number(process.env.BOOKING_PRICE_EGP) * 100;
  const [firstName, ...rest] = booking.name.trim().split(" ");
 
  const res = await fetch("https://accept.paymob.com/v1/intention/", {
    method: "POST",
    headers: {
      Authorization: `Token ${process.env.PAYMOB_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: amountCents,
      currency: "EGP",
      expiration: PAYMENT_WINDOW_SECONDS,
      payment_methods: [Number(process.env.PAYMOB_INTEGRATION_ID)],
      items: [
        {
          name: "Booking",
          amount: amountCents,
          description: "Appointment booking",
          quantity: 1,
        },
      ],
      billing_data: {
        first_name: firstName,
        last_name: rest.join(" ") || "NA",
        phone_number: booking.phone,
        email: user.email || "na@example.com",
      },
      special_reference: booking._id.toString(),
      notification_url: `${process.env.APP_URL}/api/v1/payments/webhook`,
      redirection_url: `${process.env.APP_URL}/payment-result`,
    }),
  });
 
  const data = await res.json();
  if (!res.ok || !data.client_secret) {

    throw new AppError("Failed to start payment", 502);
  }
 
  return `https://accept.paymob.com/unifiedcheckout/?publicKey=${process.env.PAYMOB_PUBLIC_KEY}&clientSecret=${data.client_secret}`;
};
 
module.exports = { createPaymentLink, PAYMENT_WINDOW_MS };
 