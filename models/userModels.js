const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const generateToken = require('../utils/tokenCrypt');
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A user must have a name!'],
    },
    email: {
      type: String,
      required: [true, 'A user must have an email!'],
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, 'Please provide a valid email'],
    },
    role: {
      type: String,
      enum: ['user', 'guide', 'lead-guide', 'admin'],
      default: 'user',
    },
    photo: String,
    password: {
      type: String,
      required: [true, 'Please enter a password!'],
      minLength: [8, 'Please enter a password of atleast 8 characters'],
      select: false,
    },
    confirmPassword: {
      type: String,
      required: [true, 'Please confirm your password!'],
      validate: {
        //this will only run on create or save.
        validator: function (el) {
          return el === this.password;
        },
        message: 'Passwords are not the same!',
      },
      select: false,
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
  },
  { timestamps: true },
);

userSchema.pre('save', async function (next) {
  // run the ufnction only if the password is modified
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  this.confirmPassword = undefined;
});

userSchema.pre('save', async function (next) {
  // run the ufnction only if the password is modified
  if (!this.isModified('password') || this.inNew) return next();
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

userSchema.methods.validatePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (
    this.passwordChangedAt.getTime() > JWTTimestamp.getTime() ||
    this.passwordChangedAt.getTime() > this.createdAt.getTime()
  ) {
    return true;
  }
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = generateToken(resetToken);
  console.log(resetToken);
  console.log(this.passwordResetToken);
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  return resetToken;
};

userSchema.methods.verifyToken = function () {
  return Date.now() < this.passwordResetExpires;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
