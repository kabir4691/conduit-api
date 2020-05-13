const mongoose = require('mongoose');

const followerSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true
  },
  followers: [
    {
      username: {
        type: String,
        required: true,
        unique: true
      },
      bio : {
        type: String,
        required: true
      },
      image: {
        type: String,
        required: true
      }
    }
]
});

module.exports = mongoose.model('follower', followerSchema);