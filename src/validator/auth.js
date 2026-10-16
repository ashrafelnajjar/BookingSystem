const Joi = require("joi");

const signupSchema = {
  body: Joi.object().keys({
    name: Joi.string().required().max(30),
    email: Joi.string().email().required(),
    password: Joi.string().required().max(40),
  }),
};

const loginSchema = {
  body: Joi.object().keys({
    email: Joi.string().email().required(),
    password: Joi.string().required().max(40),
  }),
};
module.exports = {
  loginSchema,
  signupSchema,
};
