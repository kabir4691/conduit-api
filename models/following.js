const mongoose = require('mongoose');

const followingSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true
  },
  following: [
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

module.exports = mongoose.model('following', followingSchema);