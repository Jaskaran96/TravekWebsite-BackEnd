const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config({ path: './config.env' });

const app = require('./app');

const port = process.env.PORT || 3000;

const connectionString = process.env.DB_STRING;

mongoose
  .connect(connectionString, {
    autoIndex: true,
  })
  .then(() => console.log('Connected to DB'));

app.listen(port, () => {
  console.log(`App running on port ${port}`);
});
//test
