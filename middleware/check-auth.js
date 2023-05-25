import jwt from 'jsonwebtoken';
import HttpError from '../models/http-error.js';

export default (req, res, next) => {
  try {
    const token = req.headers.authorization.splite(' ')[1];
    if (!token) {
      throw new Error('Authentication failed!');
    }
    const decodedToken = jwt.verify(token, process.env.JWT_KEY);
    req.userData = { userId: decodedToken.userId };
    next();
  } catch (err) {
    const error = new HttpError('Authentication failed!', 401);
    return next(error);
  }
};
