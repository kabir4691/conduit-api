const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const authController = require('../controllers/authController');

router.get('/:username', authController.checkAuthorization, profileController.getUser);
router.post('/:username/follow', authController.checkAuthorization, profileController.followUser);
router.delete('/:username/follow', authController.checkAuthorization, profileController.unfollowUser)

module.exports = router;
