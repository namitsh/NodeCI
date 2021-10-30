const mongoose = require('mongoose');
// const userSchema = require('../../models/User')
const User = mongoose.model('User');

module.exports = () => {
  return new User({}).save();
};
