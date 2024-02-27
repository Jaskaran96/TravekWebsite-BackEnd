class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }
  filter() {
    try {
      const queryObj = { ...this.queryString };
      const excludedFields = ['page', 'sort', 'limit', 'fields'];
      excludedFields.forEach((el) => delete queryObj[el]);

      let queryStr = JSON.stringify(queryObj);
      //we are doing this because we need a $ infront of the keyword(gte/gt/lt), this is a requirement by mongodb.
      queryStr = queryStr.replace(
        /\b(gte|gt|lte|lt)\b/g,
        (match) => `$${match}`,
      );
      this.query = this.query.find(JSON.parse(queryStr));
      return this;
    } catch (err) {
      console.log(err);
    }
  }

  sort() {
    if (this.queryString.sort) {
      const sortString = this.query.sort.split(',').join(' ');
      this.query = this.query.sort(sortString);
    } else this.query = this.query.sort('-createdAt');
    return this;
  }

  select() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v');
    }
    return this;
  }

  limit() {
    if (this.queryString.limit) {
      //const totalDocuments = await Tour.countDocuments();
      let page = 1;
      if (this.queryString.page) page = Math.max(1, this.queryString.page);
      const limit = Math.min(10, this.queryString.limit);
      const skip = (page - 1) * limit;
      // if (skip > totalDocuments)
      //   throw new Error('Skipping more docs than you actually have!');
      this.query = this.query.skip(skip).limit(limit);
    } else {
      this.query = this.query.limit(10);
    }
    return this;
  }
}

module.exports = APIFeatures;
