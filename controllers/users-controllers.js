import { v4 } from 'uuid';
import { validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
// import jwt from 'jsonwebtoken';
import HttpError from '../models/http-error.js';
import User from '../models/user.js';

export const registerUser = async (req, res, next) => {
  // console.log('req: ', req);
  // console.log('req.body: ', req.body);
  // console.log('req.file: ', req.file);
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors);
    return next(
      new HttpError('Invalid inputs passed, please check your data!', 422)
    );
  }
  const { name, email, password } = req.body;
  const { path, filename } = req.file;

  let existingUser;
  try {
    existingUser = await User.findOne({ email });
  } catch (err) {
    const error = new HttpError(
      'Signing up failed, please try again later',
      500
    );
    return next(error);
  }

  if (existingUser) {
    const error = new HttpError(
      'User exists already, please login instead. ',
      422
    );
    return next(error);
  }

  let hashedPassword;
  try {
    hashedPassword = await bcrypt.hash(password, 12);
  } catch (err) {
    const error = new HttpError(
      'Could not create user, please try again.',
      500
    );
    return next(error);
  }

  const createdUser = new User({
    name,
    email,
    avatar: { url: path, filename: filename },
    password: hashedPassword,
    posts: [],
  });

  try {
    await createdUser.save();
  } catch (err) {
    const error = new HttpError('Signing up failed, please try again.', 500);
    return next(error);
  }
  // console.log(req.body, req.files);

  res.status(201).json({ user: createdUser.toObject({ getters: true }) });
  // res.send('it workd!');
};

export const loginUser = async (req, res, next) => {
  const { email, password } = req.body;

  let existingUser;
  try {
    existingUser = await User.findOne({ email });
  } catch (err) {
    const error = new HttpError(
      'Logging in failed, please try again later',
      500
    );
    return next(error);
  }

  if (!existingUser) {
    return next(
      new HttpError(
        'Could not identify user, credentials seem to be wrong!',
        401
      )
    );
  }

  let isValidPassword = false;
  try {
    isValidPassword = await bcrypt.compare(password, existingUser.password);
  } catch (err) {
    const error = new HttpError(
      'Could not log you in, please check your credentials and try again',
      500
    );
  }
  res.json({
    message: 'Logged in!',
    user: existingUser.toObject({ getters: true }),
  });
};
