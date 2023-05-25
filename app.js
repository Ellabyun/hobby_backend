// import dotenv from 'dotenv';
// if (process.env.NODE_ENV !== 'production') {
//   dotenv.config();
// }

import fs from 'fs';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import morgan from 'morgan';
import postsRoutes from './routes/posts-routes.js';
import usersRoutes from './routes/users-routes.js';
import HttpError from './models/http-error.js';

const app = express();

app.use(express.json());
app.use(cors({ credentials: true, origin: 'http://localhost:3000' }));
app.use(morgan('tiny'));

app.use('/api/posts', postsRoutes);
app.use('/api/users', usersRoutes);

app.use((req, res, next) => {
  const error = new HttpError('Could not find this route.', 404);
  throw error;
});

//cloudinary filename으로 지우도록 수정!!.
app.use(async (error, req, res, next) => {
  if (req.files) {
    // fs.unlink(req.file.path, (err) => {
    //   console.log(err);
    // });
    for (let file of req.files) {
      await cloudinary.uploader.destroy(file.filename);
    }
  }
  if (res.headerSent) {
    return next(error);
  }
  res
    .status(error.code || 500)
    .json({ message: error.message || 'An unknown error occured!🤐' });
});

mongoose
  .connect(
    `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.7yupmxp.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`
  )
  .then(() => app.listen(process.env.PORT || 5000))
  .catch((err) => console.log(err));
