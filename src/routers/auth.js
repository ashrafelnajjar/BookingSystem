const express = require("express");
const router = express.Router();
const { loginSchema, signupSchema } = require("../validator/auth");
const {
    login,
    signup,


} = require("../controllers/auth");
const joivalidation = require("../middlewares/joi-validation");


router.post("/signup", joivalidation(signupSchema), signup);
router.post("/login", joivalidation(loginSchema), login);



module.exports = router;