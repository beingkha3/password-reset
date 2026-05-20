const { body, validationResult } = require('express-validator');

const handleErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map((e) => e.msg);
    return res.status(400).json({ success: false, message: messages.join(', ') });
  }
  next();
};

const strongPasswordPattern =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d])[A-Za-z\d\S]{8,}$/;

const forgotPasswordRules = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email'),
];

const registerRules = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email'),
  body('password')
    .notEmpty().withMessage('Password is required')
    .matches(strongPasswordPattern).withMessage(
      'Password must be at least 8 characters and include upper case, lower case, number, and special character'
    ),
];

const resetPasswordRules = [
  body('password')
    .notEmpty().withMessage('New password is required')
    .matches(strongPasswordPattern).withMessage(
      'Password must be at least 8 characters and include upper case, lower case, number, and special character'
    ),

  body('confirmPassword')
    .notEmpty().withMessage('Confirm password is required')
    .custom((value, { req }) => value === req.body.password)
    .withMessage('Passwords do not match'),
];

module.exports = { handleErrors, forgotPasswordRules, resetPasswordRules, registerRules };
