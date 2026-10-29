const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

const userSchema = new mongoose.Schema(
  {
    user: { type: String, required: true, minlength: 3 },
    password: { type: String, required: true, minlength: 6, maxlength: 50 },
    email: {
      type: String,
      required: true,
      validate: /\S+@\S+\.\S+/,
      unique: true,
    },

    roles: {
      type: String,
      enum: ["Costumer", "Admin"],
      default: "Costumer",
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        ret.createdAt = ret.createdAt.toLocaleString("en-EG", {
          timeZone: "Africa/Cairo",
        });
        ret.updatedAt = ret.updatedAt.toLocaleString("en-EG", {
          timeZone: "Africa/Cairo",
        });
        return ret;
      },
    },
  },
);
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
});


const user = mongoose.model("user", userSchema);
module.exports = user;
