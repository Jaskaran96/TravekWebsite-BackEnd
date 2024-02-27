const express = require('express');
const userController = require('./../controllers/userController');
const authController = require('./../controllers/authController');

const userRouter = express.Router();

userRouter.post('/signup', authController.signup);
userRouter.post('/login', authController.login);
userRouter.post('/forgotpassword', authController.forgotPassword);
userRouter.patch('/resetpassword/:resetToken', authController.resetPassword);

userRouter
  .route('/')
  .get(authController.authenticateUser, userController.getAllUsers)
  .post(userController.addUser);

userRouter
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser);

module.exports = userRouter;
