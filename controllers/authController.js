const User = require('../models/userModels');
const catchAsync = require('../utils/catchAsync');
const jwt = require('jsonwebtoken');
const AppError = require('../utils/appError');
const { promisify } = require('util');
const sendEmail = require('../utils/email');
const generateToken = require('../utils/tokenCrypt');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};
exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    passwordChangedAt: req.body.passwordChangedAt,
    createdAt: req.body.createdAt,
    role: req.body.role,
  });

  const token = signToken(newUser._id);
  res.status(201).json({
    status: 'success',
    token,
    data: {
      user: newUser,
    },
  });
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }
  const user = await User.findOne({ email }).select('+password');
  console.log(user);
  if (!user) return next(new AppError('The user does not exist!'));
  const validPassword = await user.validatePassword(password);
  if (!validPassword)
    return next(new AppError('The entered password is incorrect!'));
  const token = signToken(user._id);
  res.status(200).json({
    status: 'success',
    token,
  });
});

exports.authenticateUser = catchAsync(async (req, res, next) => {
  // 1) Check if the token exists, and get it

  if (!req.headers.authorization)
    return next(new AppError('No authorization token found!'));

  const authVal = req.headers.authorization.split(' ');

  if (authVal.length != 2 || authVal[0] != 'Bearer')
    return next(new AppError('Invalid authorization token!'));

  let token = authVal[1];

  // 2) Verify the token
  //since jwt.verify takes a callback, we are converting it such that it retuns a promise. After converting it we are just invoking the function
  const verifyRes = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  console.log(verifyRes);

  // 3) Check if the user still exists
  const user = await User.findById(verifyRes.id);
  if (!user) return next(new AppError('No user exists for this token!'));
  console.log(user);

  //4) Check if the user changed password after the jwt was issued
  const isPasswordChanged = user.changedPasswordAfter(
    new Date(verifyRes.iat * 1000),
  );
  if (isPasswordChanged)
    new AppError(
      'The password of the user for this token has been recently changed, kindly login again!',
    );
  req.user = user;
  next();
});

exports.authorizeUser = (...roles) => {
  return (req, res, next) => {
    const userRole = req.user.role;
    console.log(userRole);
    if (!roles.includes(userRole))
      return next(
        new AppError('This user is not authorized to perform this action!'),
      );
    next();
  };
};

exports.forgotPassword = async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) return next(new AppError('No user exists for this email ID!'));

  const resetToken = user.createPasswordResetToken();
  //We have modified the document, but not saved it thus we need to save it.
  //validateBeforeSave : If we do not provide the "required" fiels in the schema while saving, we will get an error, thus to overide providing of the required field, we are going to set this propery as false.
  await user.save({ validateBeforeSave: false });

  //send the token to the user's email
  const resetPasswordURL = `${req.protocol}://${req.get(
    'host',
  )}/api/v1/users/resetpassword/${resetToken}`;

  const message = `You generated a request for password reset. Click this URL to reset your password :: ${resetPasswordURL}`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Password reset token (10 min expiry)',
      message,
    });
    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(
      new AppError(
        'There was an error sending the email, try again later!',
        500,
      ),
    );
  }
};

exports.resetPassword = async (req, res, next) => {
  //Fetch the user for whom the password has to be reset
  const resetToken = generateToken(req.params.resetToken);

  const user = await User.findOne({ passwordResetToken: resetToken });
  if (!user) return next(new AppError('No such token exists, try again!'));

  //Check if the token has not expires
  const tokenVerification = user.verifyToken();
  if (!tokenVerification)
    return next(
      new AppError(
        'The token token has expired, generate a new one and try again!',
      ),
    );
  user.password = req.body.password;
  user.confirmPassword = req.body.confirmPassword;
  user.passwordResetExpires = undefined;
  user.passwordResetToken = undefined;
  await user.save();
  const token = signToken(user._id);
  res
    .status(200)
    .json({ status: 'Success', message: 'Password reset successfull', token });
  //Reset the password and reset the token
};
