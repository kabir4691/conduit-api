const ArticleModel = require('../models/article');
const UserModel = require('../models/user');
const FavoriteModel = require('../models/favorite');
const FollowingModel = require('../models/following');
const ApiError = require('../models/apiError');

const add = (req, res, next) => {

  const { title, description, body } = req.body.article;

  if (!title) return next(new ApiError('Title cannot be empty'));
  if (!description) return next(new ApiError('Description cannot be empty'));
  if (!body) return next(new ApiError('Body cannot be empty'));

  req.body.article.slug = title.toLowerCase().split(' ').join('-') + `-${Date.now()}`;
  req.body.article.author = req.user.userId;

  ArticleModel.create(req.body.article)
  .then(document => {
    return document.populate('author', {username: 1, bio: 1, image: 1, _id : 0}).execPopulate();
  })
  .then(document => {
    res.json({ article: document });
  })
  .catch(err => next(err));
};

const getOne = (req, res, next) => {
  const { slug } = req.params;

  let articleDocument, isFollowingAuthor = false;
  ArticleModel.findOne({ slug })
  .then(document => {
    if (document === null) return Promise.reject(new ApiError('Article not found'));
    articleDocument = document;
    return req.user ? FavoriteModel.findOne({article: document._id, users: req.user.userId}): null;
  })
  .then(document => {
    articleDocument._doc.favorited = document !== null;
    return req.user ? FollowingModel.findOne({user: req.user.userId, followings: articleDocument.author}): null;
  })
  .then(document => {
    isFollowingAuthor = document !== null;
    return articleDocument.populate('author', {username: 1, bio: 1, image: 1, _id : 0}).execPopulate()
  })
  .then(document => {
    document.author._doc.following = isFollowingAuthor;
    res.json({ article: document});
  })
  .catch(err => next(err));
};

const getMany = async (req, res, next) => {

  let { author, favorited, limit, offset } = req.query;

  let filterObject = {};

  if (author) {
    try {
      const userDocument = await UserModel.findOne({ username: author });
      if (userDocument === null) return next(new ApiError(`User with username ${author} not found`));
      filterObject.author = userDocument._id;
    } catch(err) {
      return next(err);
    }
  }

  if (favorited && req.user) {
    try {
      const favoritedArticles = await FavoriteModel.find({'users': req.user.userId});
      if (favoritedArticles.length) {
        const articleIds = [];
        favoritedArticles.forEach(item => articleIds.push(item.article));
        filterObject._id = { $in: articleIds };
      } else {
        return next(new ApiError('No favorited articles found for user'));
      }
    } catch(err) {
      return next(err);
    }
  }

  limit = Number(limit) || 20;
  offset = Number(offset) || 0;

  let articleDocuments;
  ArticleModel.find(filterObject, null, { limit, skip: offset, sort: { createdAt: -1 } }).populate('author', {username: 1, bio: 1, image: 1, _id : 1}).exec()
  .then(documents => {
    if (!documents) return Promise.reject(new ApiError('No documents found with given criteria'));
    articleDocuments = documents;
    return req.user ? FollowingModel.findOne({user : req.user.userId}) : null;
  })
  .then(document => {
    if (document === null) {
      articleDocuments.forEach(item => {
        item.author._doc.following = false;
        delete item.author._id;
      })
    } else {
      articleDocuments.forEach(item => {
        item.author._doc.following = document.followings.includes(item.author._id);
        delete item.author._id;
      })
    }
    res.json({ articles: articleDocuments });
  })
  .catch(err => next(err));
}

const update = (req, res, next) => {
  const { slug } = req.params;
  
  if (!req.body.article) {
    return next(new ApiError('Invalid input'));
  }
  const { title, description, body } = req.body.article;

  if (!title && !description && !body) {
    return next(new ApiError('Invalid input'));
  }

  ArticleModel.findOne({ slug }).populate()
  .then(document => {
    if (document === null) return Promise.reject(new ApiError('Article not found'));
    if (document.author.toString() !== req.user.userId) {
      return Promise.reject(new ApiError('Only author can update article'));
    }
    if ('title' in req.body.article) {
      if (!title) {
        return Promise.reject(new ApiError('Title cannot be blank'))
      } else {
        document.title = title;
      }
    }
    if ("description" in req.body.article) {
      if (!description) {
        return Promise.reject(new ApiError('Description cannot be blank'))
      } else {
        document.description = description;
      }
    }
    if ('body' in req.body.article) {
      if (!body) {
        return Promise.reject(new ApiError('Body cannot be blank'))
      } else {
        document.body = body;
      }
    }
    return document.save();
  })
  .then(document => {
    return document.populate('author', {username: 1, bio: 1, image: 1, _id : 0}).execPopulate();
  })
  .then(document => {
    document.author._doc.following = false;
    res.json({ article: document });
  })
  .catch(err => next(err));
}

const remove = (req, res, next) => {
  const { slug } = req.params;

  ArticleModel.findOne({ slug })
  .then(document => {
    if (document === null) return Promise.reject(new ApiError('Article not found'));
    if (document.author.toString() !== req.user.userId) {
      return Promise.reject(new ApiError('Only author can delete article'));
    }
    return ArticleModel.deleteOne({ slug });
  })
  .then(_ => {
    res.sendStatus(200);
  })
  .catch(err => next(err));
}

module.exports = {
  add,
  getOne,
  getMany,
  update,
  remove
}