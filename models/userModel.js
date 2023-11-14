const mongoose = require('mongoose');
const validator = require('validator');

const FIELDS = [
  'tech',
  'education',
  'music',
  'healthcare',
  'cooking',
  'babysitting',
  'home-maintenance',
];

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'please provide name'],
  },
  email: {
    type: String,
    required: [true, 'please provide e-mail'],
    unique: true,
    validate: [validator.isEmail, 'Please provide a valid e-mail'],
  },
  password: {
    type: String,
    minlength: [8, 'password must be at least 8 characters'],
    //make it not show up in a query:
    select: false,
  },
  passwordConfirm: {
    type: String,
    //A validator to check if the two passwords on 'save' are the same:
    validate: function (password) {
      return password === this.password;
    },
    message: 'passwords do not match',
  },
  passwordChangedAt: Date(),
  active: { type: Boolean, default: true },
  field: {
    type: [String],
    enum: {
      values: FIELDS,
      message: `Please choose from: ${FIELDS.join(' ')}`,
    },
  },
  subfield: String,
  bio: String,
  /* -----implement reviews with parent referencing----- */
  role: {
    type: String,
    enum: {
      values: ['user', 'admin'],
      message: 'role is either user or admin',
    },
    default: 'user',
  },
  credit: { type: Number, default: 0 },
});

const User = mongoose.model('User', userSchema);
module.exports = User;
