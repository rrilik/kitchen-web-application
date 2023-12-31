const jwt = require('jsonwebtoken');
const asyncHandler = require('../errors/asyncHandler');
const { filterObject } = require('../utils/objectUtils');
const User = require('../models/userModel');
const AppError = require('../errors/AppError');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

const createSendToken = (user, statusCode, req, res) => {
  const token = signToken(user.get('_id'));

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  res.cookie('jwt', token, cookieOptions);

  user.password = undefined;
  user.passwordConfirm = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    user,
  });
};

exports.signup = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (user) throw new AppError('Уже є обліковий запис із цією електронною адресою', 400);

  const userInfo = filterObject(
    req.body,
    'fullName',
    'email',
    'password',
    'passwordConfirm'
  );

  const newUser = await User.create(userInfo);

  createSendToken(newUser, 201, req, res);
});

exports.logout = asyncHandler((req, res, next) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ status: 'success' });
});

exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new AppError('Введіть адресу електронної пошти та пароль', 400);
  }

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.checkPassword(password, user.password))) {
    throw new AppError('Неправильний пароль або електронна адреса!', 401);
  }

  return createSendToken(user, 200, req, res);
});

exports.updatePassword = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.get('_id'));

  if (!(await user.checkPassword(req.body.currentPassword, user.password))) {
    throw new AppError('Старий пароль неправильний', 400);
  }

  user.password = req.body.newPassword;
  user.passwordConfirm = req.body.newPasswordConfirm;
  await user.save();

  return createSendToken(user, 200, req, res);
});
