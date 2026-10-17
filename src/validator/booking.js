const Joi = require("joi");
const objectId = require("../middlewares/objectId");

const dateRule = Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/);
const timeRule = Joi.string()
  .pattern(/^([01]\d|2[0-3]):00$/)
  .messages({
    "string.pattern.base": "startTime must be on the hour (09:00)",
  });
const phoneRule = Joi.string()
  .pattern(/^01[0125]\d{8}$/)
  .messages({
    "string.pattern.base": "invalid Egyptian phone number",
  });

const getAvailableSlotsSchema = {
  query: Joi.object({ date: dateRule.required() }),
};
const createBookingSchema = {
  body: Joi.object({
    date: dateRule.required(),
    startTime: timeRule.required(),
    name: Joi.string().trim().min(3).max(30).required(),
    phone: phoneRule.required(),
    description: Joi.string().trim().min(10).max(300).required(),
    paymentMethod: Joi.string().valid("online", "onsite").required(),
  }),
};
const updateBookingSchema = {
  params: Joi.object({ id: Joi.string().custom(objectId).required() }),
  body: Joi.object({
    date: dateRule,
    startTime: timeRule,
    name: Joi.string().trim().min(3).max(30),
    phone: phoneRule,
    description: Joi.string().trim().min(10).max(300),
  }).min(1),
};
const cancelBookingSchema = {
  params: Joi.object({ id: Joi.string().custom(objectId).required() }),
};
const getBookingSchema = {
  query: Joi.object({
    status: Joi.string().valid("pending", "confirmed", "cancelled", "finished"),
    date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/),
    page: Joi.number().integer().min(1),
    limit: Joi.number().integer().min(1).max(50),
  }),
};

module.exports = {
  getAvailableSlotsSchema,
  createBookingSchema,
  updateBookingSchema,
  cancelBookingSchema,
  getBookingSchema
};
