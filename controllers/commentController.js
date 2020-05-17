const ArticleModel = require('../models/article');
const CommentModel = require('../models/comment');
const FollowingModel = require('../models/following');
const ApiError = require('../models/apiError');

const add = (req, res, next) => {

  const { comment } = req.body;
  const { slug } = req.params;

  if (!comment) return next(new ApiError('Comment required'));
  if (!comment.body) return next(new ApiError('Comment body cannot be empty'));

  req.body.comment.author = req.user.userId;

  ArticleModel.findOne({ slug })
  .then(document => {
    if (document === null) return Promise.reject(new ApiError('Article not found'));
    req.body.comment.article = document._id;
    return CommentModel.create(req.body.comment);
  })
  .then(document => {
    return document.populate('author', { username: 1, bio: 1, image: 1, _id : 0 }).execPopulate();
  })
  .then(document => {
    document.author._doc.following = false;
    res.json({ comment: document });
  })
  .catch(err => next(err));
};

const getMany = (req, res, next) => {
  const { slug } = req.params;

  let commentDocuments;
  ArticleModel.findOne({ slug })
  .then(document => {
    if (document === null) return Promise.reject(new ApiError('Article not found'));
    return CommentModel.find({article: document._id}).populate('author', { username: 1, bio: 1, image: 1, _id : 1 }).exec();
  })
  .then(documents => {
    commentDocuments = documents;
    return req.user ? FollowingModel.findOne({ user: req.user.userId }) : null;
  })
  .then(document => {
    if (document === null) {
      commentDocuments.forEach(item => {
        item.author._doc.following = false;
        delete item.author._id;
      })
    } else {
      commentDocuments.forEach(item => {
        item.author._doc.following = document.followings.includes(item.author._id);
        delete item.author._id;
      })
    }
    res.json({ comments: commentDocuments });
  })
  .catch(err => next(err));
};

const remove = (req, res, next) => {
  const { slug, id } = req.params;

  ArticleModel.findOne({ slug })
  .then(document => {
    if (document === null) return Promise.reject(new ApiError('Article not found'));
    return CommentModel.findOne({ article: document._id, _id: id });
  })
  .then(document => {
    if (document === null) return Promise.reject(new ApiError('Comment not found'));
    if (document.author.toString() !== req.user.userId) return Promise.reject(new ApiError('Only comment author can delete comment'));
    return CommentModel.findByIdAndDelete(document._id);
  })
  .then(_ => {
    res.sendStatus(200);
  })
  .catch(err => next(err));
};

module.exports = {
  add,
  getMany,
  remove
}