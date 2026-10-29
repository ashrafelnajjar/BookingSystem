const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "name is required"],
      trim: true,
      minlength: 2,
      maxlength: 50,
    },
    email: {
      type: String,
      required: [true, "email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "password is required"],
      minlength: 8,
      select: false,            
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
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
