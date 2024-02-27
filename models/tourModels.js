const mongoose = require('mongoose');
const slugify = require('slugify');
const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true,
      maxlength: [
        40,
        ' The tour name must not exceed 40 characters, try again!',
      ],
      minlength: [
        10,
        ' The tour name must not fall below 10 characters, try again!',
      ],
    },
    slug: String,
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty can only be easy, medium or difficult!',
      },
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          // This kind of validator only works during new document creation.
          return val < this.price;
        },
        message: 'The discount entered is more than the item price lol!',
      },
    },
    summary: {
      type: String,
      trim: true, //removes white spaces from beg and end of the string
      required: [true, 'A tour must have a description'],
    },
    description: {
      type: String,
      trim: true, //removes white spaces from beg and end of the string
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image'],
    },
    secretTour: {
      type: Boolean,
      default: false,
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    startDates: [Date],
  },
  {
    toJSON: { virtuals: true },
  },
);

tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

//This is document middleware, and it runs ONLY before the .save() and .create() for a document. This middleware will NOT run for .insertMany()

tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true }); // this points to the currently referenced document
  next(); //We need to execute this to call the next middleware in the mongoose
});

// tourSchema.pre('save', function (next) {
//   console.log("This is another pre-save middleware for example!")
//   next(); //We need to execute this to call the next middleware in the mongoose
// });

//All the post middlewares are executed after the pre middlewares
// tourSchema.post('save', function (doc, next) {
//   console.log(doc);
//   next();f
// });

//Query middleware
//This find only runs for the find() method and not for findOne method.
//Thus we create a reg expression to trigger this middleware for both find and findOne
tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } }); //this points to the query object
  next();
});

tourSchema.post(/^find/, function (docs, next) {
  //docs points to all the documents that were returned after executing the query
  console.log(docs);
  next();
});

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
