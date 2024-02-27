const Tour = require('../models/tourModels');
const APIFeatures = require('../utils/apiFeatures');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
//This alias will called from a middleware to modify the req object.
exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};

exports.getAllTours = catchAsync(async (req, res) => {
  //execute the query
  const features = new APIFeatures(Tour.find(), req.query)
    .filter()
    .sort()
    .select()
    .limit();
  const tours = await features.query;
  res.status(200).json({
    status: 'Success',
    results: tours.length,
    data: {
      tours,
    },
  });
});

exports.getTour = catchAsync(async (req, res) => {
  const tours = await Tour.findById(req.params.id);
  if (!tours) {
    return next(new AppError('No tour found with this ID', 404));
  }
  res.status(200).json({
    status: 'Success',
    data: {
      tours,
    },
  });
});

exports.addTour = catchAsync(async (req, res, next) => {
  const message = await Tour.create(req.body);
  res.status(200).json({
    status: 'Success',
    data: {
      message,
    },
  });
});

exports.updateTour = catchAsync(async (req, res) => {
  const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!tour) {
    return next(new AppError('No tour found with this ID', 404));
  }
  res.status(200).json({
    status: 'Success',
    data: {
      tour,
    },
  });
});

exports.deleteTour = catchAsync(async (req, res) => {
  const tour = await Tour.findByIdAndDelete(req.params.id);
  if (!tour) {
    return next(new AppError('No tour found with this ID', 404));
  }
  res.status(200).json({
    status: 'Success',
    data: {
      tour,
    },
  });
});

exports.getTourStats = catchAsync(async (req, res) => {
  //we need to include $
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } },
    },
    {
      $group: {
        _id: '$difficulty',
        num: { $sum: 1 },
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    //1 for ascd, -1 for desc
    {
      $sort: { avgPrice: 1 },
    },
    // {
    //   $match: { _id: { $ne: 'easy' } },
    // },
  ]);
  res.status(200).json({
    status: 'Success',
    data: {
      message: stats,
    },
  });
});

exports.getMonthlyPlan = catchAsync(async (req, res) => {
  const year = req.query.year * 1; // to convert it to a number
  console.log(year);
  const stats = await Tour.aggregate([
    //since our startDate was an array of start dates, we are replication each document with each element in the array.
    {
      $unwind: '$startDates',
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' }, //grouping by the month of each doc
        numTourStarts: { $sum: 1 },
        tours: { $push: '$name' },
      },
    },
    {
      $addFields: { month: '$_id' },
    },
    {
      //putting 0 hides the property from the result.
      $project: {
        _id: 0,
      },
    },
    {
      $sort: {
        numTourStarts: -1,
      },
    },
    {
      $limit: 12,
    },
  ]);
  //console.log(stats);
  res.status(200).json({
    status: 'Success',
    data: {
      message: stats,
    },
  });

  res.status(404).json({
    status: 'Failed',
    data: {
      message: err,
    },
  });
});
