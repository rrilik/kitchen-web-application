const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const validator = require('validator');
const { getImageUrl } = require('../utils/image');

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Поле повного імені не повинно бути пустим'],
    },
    email: {
      type: String,
      unique: true,
      lowercase: true,
      required: [true, 'Електронна пошта не є вакантною'],
      validate: [validator.isEmail, 'Електронна пошта не є хорошою'],
    },
    password: {
      type: String,
      required: [true, 'Пароль не може бути пустим'],
      minLength: [8, 'Пароль мінімум 8 символів'],
      select: false,
    },
    passwordConfirm: {
      type: String,
      required: [true, 'Поле підтвердження пароля не може бути пустим'],
      validate: {
        validator: function (el) {
          return this.password === el;
        },
        message: 'Підтвердьте, що пароль не збігається з паролем',
      },
    },
    passwordChangedAt: {
      type: Date,
    },
    phoneNumber: {
      type: String,
    },
    address: {
      type: String,
    },
    image: {
      type: String,
      default: 'public/images/users/user-default.png',
    },
    role: {
      type: String,
      enum: ['MANAGER', 'STAFF', 'CUSTOMER'],
      default: 'CUSTOMER',
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    id: false,
    timestamps: true,
    versionKey: false,
    toJSON: { virtuals: true, getters: true },
    toObject: { virtuals: true, getters: true },
  }
);

userSchema.index({ email: 1 });
userSchema.index({ '$**': 'text' });

userSchema.path('image').get((value) => getImageUrl(value));

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  this.passwordConfirm = undefined;
  return next();
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;
  return next();
});

userSchema.methods.checkPassword = async function (
  candidatePassword,
  userPassword
) {
  const result = await bcrypt.compare(candidatePassword, userPassword);
  return result;
};

userSchema.methods.changedPasswordAfter = function (jwtTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return jwtTimestamp < changedTimestamp;
  }
  return false;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
