const dotenv = require('dotenv');
const mongoose = require('mongoose');
const fs = require('fs');
const Tour = require('../../models/tourModels');

dotenv.config({ path: '../../config.env' });

const connectionString = process.env.DB_STRING;

mongoose
  .connect(connectionString, {
    autoIndex: true,
  })
  .then(() => console.log('Connected to DB'));

const tours = JSON.parse(fs.readFileSync('tours-simple.json', 'utf-8'));

const importData = async () => {
  try {
    await Tour.create(tours);
    console.log('Data is successfully loaded!');
  } catch (err) {
    console.log(err);
  } finally {
    process.exit();
  }
};

const clearData = async () => {
  try {
    await Tour.deleteMany();
    console.log('Data is deleted successfully!');
  } catch (err) {
    console.log(err);
  } finally {
    process.exit();
  }
};

if (process.argv[2] === '--import') importData();
else if (process.argv[2] === '--delete') clearData();
