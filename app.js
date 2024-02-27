const express = require('express');
const fs = require('fs');
const app = express();
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
//****TOP LEVEL CODE */
app.use(express.json());

app.use(express.static(`${__dirname}/public`));

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// Mounting the router
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

//If our req reaches this middleware then it means it did not match any of the two
//routes above thus we handle it.
app.all('*', (req, res, next) => {
  //   res.status(404).json({
  //     status: 'fail',
  //     message: `Can't find ${req.originalUrl} on this server`,
  //   });
  const err = new AppError(`Can't find ${req.originalUrl} on this server`, 404);
  next(err); //express knows that whenever we pass anything into the next then it is an error, it will skip all the further middlewares and pass the error to the global error middleware handler
});

// by giving 4 parameters, express knows this is an error handling middleware
app.use(globalErrorHandler);

module.exports = app;
