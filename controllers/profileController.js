const UserModel = require('../models/user');
const FollowingModel = require('../models/following');
const FollowerModel = require('../models/follower');
const ApiError = require('../models/apiError');

const getUser = (req, res, next) => {
  const username = req.params.username;
  if (!username) return next(new ApiError('Please specify username'));

  UserModel.findOne({username})
  .then(document => {
    if (document === null) {
      return Promise.reject(new ApiError('Username not found'));
    }
    res.json(getApiResponse(document));
  })
  .catch(err => next(err));
}

const followUser = async (req, res, next) => {
  const username = req.params.username;
  if (!username) return next(new ApiError('Please specify username'));

  // Check if user is already followed
  const followingDocument = await FollowingModel.findOne({ userId: req.userId
  });
  if (followingDocument) {
    const alreadyFollowerUser = followingDocument.following.find(item => item.username === username);
    if (alreadyFollowerUser) return res.json({
      profile: {
        username: alreadyFollowerUser.username,
        bio: alreadyFollowerUser.bio,
        image: alreadyFollowerUser.image
      }
    });
  }

  // Check if user to follow exists
  const followedUserDocument = await UserModel.findOne({username});
  if (!followedUserDocument) return next(new ApiError('Username not found'));
  // Check if trying to follow self
  if (followedUserDocument._id === req.userId) return next(new ApiError('Cannot follow self'));

  try {
    const currentUserDocument = await UserModel.findById(req.userId);

    const followingDocument = await FollowingModel.findOneAndUpdate({ userId: req.userId },
      { $addToSet: { 
        following: {
          username: followedUserDocument.username,
          bio: followedUserDocument.bio,
          image: followedUserDocument.image,
        }
      }}, { new: true, upsert: true });

    const followerDocument = await FollowerModel.findOneAndUpdate({ userId: followedUserDocument._id },
    { $addToSet: { 
      followers: {
        username: currentUserDocument.username,
        bio: currentUserDocument.bio,
        image: currentUserDocument.image,
      }
    }}, { new: true, upsert: true });

    currentUserDocument.following = followingDocument.following.length;
    await currentUserDocument.save();

    followedUserDocument.followers = followerDocument.followers.length;
    await followedUserDocument.save();

    res.json(getApiResponse(followedUserDocument));
  } catch(err) { return next(err); }
}

const unfollowUser = async (req, res, next) => {
  const username = req.params.username;
  if (!username) return next(new ApiError('Please specify username'));

  // Check if user to unfollow exists
  const followedUserDocument = await UserModel.findOne({username});
  if (!followedUserDocument) return next(new ApiError('Username not found'));
  // Check if trying to unfollow self
  if (followedUserDocument._id === req.userId) return next(new ApiError('Cannot follow/unfollow self'));

  try {
    const currentUserDocument = await UserModel.findById(req.userId);

    const followingDocument = await FollowingModel.findOne({ userId: req.userId });
    if (followingDocument) {
      followingDocument.following = followingDocument.following.filter(item => item.username !== username);
      await followingDocument.save();
    }

    const followerDocument = await FollowerModel.findOne({ userId: followedUserDocument._id });
    if (followerDocument) {
      followerDocument.followers = followerDocument.followers.filter(item => item.username !== currentUserDocument.username);
      await followerDocument.save();
    }

    currentUserDocument.following = followingDocument ? followingDocument.following.length : 0;
    await currentUserDocument.save();

    followedUserDocument.followers = followerDocument ? followerDocument.followers.length : 0;
    await followedUserDocument.save();

    res.json(getApiResponse(followedUserDocument));
  } catch(err) { return next(err); }
}

const getApiResponse = userDocument => {
  return { profile: {
    username: userDocument.username,
    bio: userDocument.bio,
    image: userDocument.image
  }};
}

module.exports = {
  getUser,
  followUser,
  unfollowUser
}