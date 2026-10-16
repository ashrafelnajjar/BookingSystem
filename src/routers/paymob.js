const express = require("express");
const router = express.Router();
const { paymobWebhook } = require("../controllers/payment");


router.post("/webhook", paymobWebhook);

module.exports = router;
