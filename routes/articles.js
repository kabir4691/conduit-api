const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const articleController = require('../controllers/articleController');
const favoriteController = require('../controllers/favoriteController');
const commentController = require('../controllers/commentController');

router.post('/', authController.checkAuthorization, articleController.add);
router.get('/:slug', authController.checkAuthorizationOptional,  articleController.getOne);
router.get('/', authController.checkAuthorizationOptional, articleController.getMany);
router.put('/:slug', authController.checkAuthorization, articleController.update);
router.delete('/:slug', authController.checkAuthorization, articleController.remove);
router.post('/:slug/favorite', authController.checkAuthorization, favoriteController.add);
router.delete('/:slug/favorite', authController.checkAuthorization, favoriteController.remove);
router.get('/:slug/comments', authController.checkAuthorizationOptional, commentController.getMany);
router.post('/:slug/comments', authController.checkAuthorization, commentController.add);
router.delete('/:slug/comments/:id', authController.checkAuthorization, commentController.remove);

module.exports = router;
