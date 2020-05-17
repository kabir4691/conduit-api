const ArticleModel = require('../models/article');
const FavoriteModel = require('../models/favorite');
const ApiError = require('../models/apiError');

const add = (req, res, next) => {
  const { slug } = req.params;

  let articleDocument;
  ArticleModel.findOne({ slug })
  .then(document => {
    if (document === null) return Promise.reject(new ApiError('Article cannot be found'));
    articleDocument = document;
    return FavoriteModel.findOne({ article: document._id });
  })
  .then(document => {
    if (document === null) {
      document = new FavoriteModel({
        article: articleDocument._id,
        users: [req.user.userId]
      });
      return document.save();
    } else {
      if (document.users.includes(req.user.userId)) {
        return Promise.resolve(document);
      } else {
        document.users.push(req.user.userId);
        return document.save();
      }
    }
  })
  .then(document => {
    const currFavoritesCount = document.users.length;
    if (articleDocument.favoritesCount !== currFavoritesCount) {
      articleDocument.favoritesCount = currFavoritesCount;
      return articleDocument.save();
    } else {
      return Promise.resolve(articleDocument);
    }
  })
  .then(document => {
    return document.populate('author', { username: 1, bio: 1, image: 1, _id: 0}).execPopulate();
  })
  .then(document => {
    document._doc.favorited = true;
    res.json({ article: document });
  })
  .catch(err => next(err));
}

const remove = (req, res, next) => {
  const { slug } = req.params;

  let articleDocument;
  ArticleModel.findOne({ slug })
  .then(document => {
    if (document === null) return Promise.reject(new ApiError('Article cannot be found'));
    articleDocument = document;
    return FavoriteModel.findOne({ article: document._id });
  })
  .then(async document => {
    if (document !== null) {
      if (document.users.includes(req.user.userId)) {
        document.users = document.users.filter(item => item.toString() !== req.user.userId);
        try {
          await document.save();
          articleDocument.favoritesCount = document.users.length;
          articleDocument = await articleDocument.save();
        } catch(err) {
          return Promise.reject(err);
        }
      } 
    }
    return articleDocument.populate('author', { username: 1, bio: 1, image: 1, _id: 0}).execPopulate();
  })
  .then(document => {
    document._doc.favorited = false;
    res.json({ article: document });
  })
  .catch(err => next(err));
}

module.exports = {
  add,
  remove
}