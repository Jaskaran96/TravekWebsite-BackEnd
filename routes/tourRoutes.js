const express = require('express');
const tourController = require('./../controllers/tourController');
const authController = require('./../controllers/authController');
const router = express.Router();

router
  .route('/top-5-cheap')
  .get(tourController.aliasTopTours, tourController.getAllTours);
// router.param('id', tourController.checkID);
router.route('/tour-stats').get(tourController.getTourStats);
router.route('/busy-month').get(tourController.getMonthlyPlan);

router
  .route('/')
  .get(authController.authenticateUser, tourController.getAllTours)
  .post(tourController.addTour);
router
  .route('/:id')
  .get(tourController.getTour)
  .patch(tourController.updateTour)
  .delete(
    authController.authenticateUser,
    authController.authorizeUser('admin', 'lead-guide'),
    tourController.deleteTour,
  );

module.exports = router;
