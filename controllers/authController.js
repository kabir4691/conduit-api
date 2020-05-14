const jwt = require('jsonwebtoken');
const ApiError = require('../models/apiError');

const generateToken = (userDocument, callback) => {
  jwt.sign(getJWTPayload(userDocument), process.env.JWT_SECRET, (err, token) => {
    if (err) callback(err);
    callback(null, token)
  });
};

const getJWTPayload = userDocument => { 
  return {
    userId: userDocument._id,
    username: userDocument.username
  }
};

const checkAuthorization = (req, res, next) => {
  const { authorization } = req.headers;
  if (!authorization) return next(new ApiError("Authorization required"));
  const token = authorization.split('Token: ')[1];
  if (!token) return next(new ApiError("Invalid authorization format"));
  const payload = jwt.verify(token, process.env.JWT_SECRET);
  req.user = payload;
  req.token = token;
  next();
}


module.exports = {
  generateToken,
  checkAuthorization
}
 

