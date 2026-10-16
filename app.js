require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const connectDB = require("./src/config/db");
const notfound = require("./src/middlewares/notfound");
const errorhandler = require("./src/middlewares/error");
const routerauth = require("./src/routers/auth");
const routerbooking = require("./src/routers/booking");
const routerpayment = require("./src/routers/paymob");
const rateLimiter = require("./src/middlewares/ratelimiter");

const app = express();
app.use(express.json());

app.use(
  "/api",
  rateLimiter({
    windowMs: 60 * 1000,
    limit: 100,
    prefix: "rl:global:",
  }),
);
app.use(
  "/api/v1/auth",
  rateLimiter({
    windowMs: 2 * 60 * 1000,
    limit: 5,
    prefix: "rl:login:",
    skipSuccessfulRequests: true,
  }),
  routerauth,
);
app.use(
  "/api/v1/booking",
  rateLimiter({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    prefix: "rl:booking:",
    skipSuccessfulRequests: true,
  }),
  routerbooking,
);
app.use("/api/v1/payments", routerpayment);
app.get("/payment-result", (req, res) => {
  const ok = req.query.success === "true";
  res
    .type("html")
    .send(
      `<meta charset="utf-8"><h2>${
        ok ? "تم الدفع بنجاح ✅" : "الدفع ماتمش ❌"
      }</h2>`,
    );
});

app.use(notfound);
app.use(errorhandler);
const PORT = process.env.PORT || 5000;
connectDB().then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
