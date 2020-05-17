const mongoose = require('mongoose');

const followingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true,
    unique: true
  },
  followings: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      required: true
    }
]
});

module.exports = mongoose.model('following', followingSchema);