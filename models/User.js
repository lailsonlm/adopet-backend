const mongoose = require('mongoose')

const User = mongoose.model('User', {
  name: String,
  email: String,
  password: String,
  github: String,
  phone: String,
  city: String,
  about: String
})

module.exports = User;