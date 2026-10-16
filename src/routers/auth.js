const express = require("express");
const router = express.Router();
const { loginSchema, signupSchema } = require("../validator/auth");
const {
    login,
    signup,
    forgotPassword,
    resetPassword,
} = require("../controllers/auth");
const joivalidation = require("../middlewares/joi-validation");


router.post("/signup", joivalidation(signupSchema), signup);
router.post("/login", joivalidation(loginSchema), login);
router.post("/forgot password",forgotPassword);

router.patch("/reset password؟/:token",resetPassword)



module.exports = router;