const UserModel = require('../models/user');
const FollowingModel = require('../models/following');
const FollowerModel = require('../models/follower');
const ApiError = require('../models/apiError');

const getUser = (req, res, next) => {
  const username = req.params.username;
  if (!username) return next(new ApiError('Please specify username'));

  let userDocument;
  UserModel.findOne({username})
  .then(document => {
    if (document === null) {
      return Promise.reject(new ApiError('Username not found'));
    }
    userDocument = document;
    return req.user ? FollowingModel.findOne({ user: req.user.userId, followings: document._id }) : null;
  })
  .then(document => {
    res.json(getApiResponse(userDocument, document !== null));
  })
  .catch(err => next(err));
}

const followUser = async (req, res, next) => {
  const username = req.params.username;

  if (!username) return next(new ApiError('Please specify username'));

  let otherUserDocument;
  try {
    otherUserDocument = await UserModel.findOne({ username });

    if (otherUserDocument === null) return next(new ApiError(`User with username ${username} not found`));

    if (otherUserDocument._id.toString() === req.user.userId) return next(new ApiError('Cannot follow self'));

    const followingDocument = await FollowingModel.findOneAndUpdate(
      { user: req.user.userId },
      { $addToSet: { followings: otherUserDocument._id } },
      { upsert: true, new: true}
    );

    const followerDocument = await FollowerModel.findOneAndUpdate(
      { user: otherUserDocument._id },
      { $addToSet: { followers: req.user.userId } },
      { upsert: true, new: true}
    );

    await UserModel.findByIdAndUpdate(
      req.user.userId,
      { following: followingDocument.followings.length }
    );

    otherUserDocument.followers = followerDocument.followers.length;
    await otherUserDocument.save()

    res.json(getApiResponse(otherUserDocument, true));
  } catch(err) {
    return next(err);
  }
}

const unfollowUser = async (req, res, next) => {
  const { username } = req.params;

  if (!username) return next(new ApiError('Please specify username'));

  let otherUserDocument;
  try {
    otherUserDocument = await UserModel.findOne({ username });

    if (otherUserDocument === null) return next(new ApiError(`User with username ${username} not found`));

    if (otherUserDocument._id.toString() === req.user.userId) return next(new ApiError('Cannot unfollow self'));

    const followingDocument = await FollowingModel.findOneAndUpdate(
      { user: req.user.userId },
      { $pull: { followings: otherUserDocument._id } },
      { upsert: true, new: true}
    );

    const followerDocument = await FollowerModel.findOneAndUpdate(
      { user: otherUserDocument._id },
      { $pull: { followers: req.user.userId } },
      { upsert: true, new: true}
    );

    await UserModel.findByIdAndUpdate(
      req.user.userId,
      { following: followingDocument.followings.length }
    );

    otherUserDocument.followers = followerDocument.followers.length;
    await otherUserDocument.save()

    res.json(getApiResponse(otherUserDocument, false));
  } catch(err) {
    return next(err);
  }
}

const getApiResponse = (userDocument, following) => {
  return { profile: {
    username: userDocument.username,
    bio: userDocument.bio,
    image: userDocument.image,
    following
  }};
}

module.exports = {
  getUser,
  followUser,
  unfollowUser
}