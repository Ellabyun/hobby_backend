import mongoose from 'mongoose';
import HttpError from '../models/http-error.js';
import { validationResult } from 'express-validator';
import { v2 as cloudinary } from 'cloudinary';
import Post from '../models/post.js';
import User from '../models/user.js';

export const getPosts = async (req, res, next) => {
  const posts = await Post.find({}).populate('creator');
  console.log(posts);
  res.status(200).json({
    posts: posts.map((post) => post.toObject({ getters: true })),
  });
};

export const getPostById = async (req, res, next) => {
  const postId = req.params.pid;

  let post;
  try {
    post = await Post.findById(postId).populate('creator');
  } catch (err) {
    const error = new HttpError('Something went wrong!', 500);
    return next(error);
  }
  if (!post) {
    const error = new HttpError(
      'Could not find a post for the privided id.',
      404
    );
    return next(error);
  }
  res.json({ post: post.toObject({ getters: true }) });
};

export const getPostsByUserId = async (req, res, next) => {
  const userId = req.params.uid;
  let posts;
  try {
    posts = await Post.find({ creator: userId }).populate('creator');
  } catch (err) {
    const error = new HttpError(
      'Fetching posts failed, please try again later',
      500
    );
    return next(error);
  }
  if (!posts || posts.length === 0) {
    return next(
      new HttpError('Could not find a post for the provided user id.', 404)
    );
  }
  res.json({ posts: posts.map((post) => post.toObject({ getters: true })) });
};

export const createPost = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError('Invalid inputs passed, please check your data!', 422)
    );
  }
  console.log(req.body);
  console.log(req.files);
  const { comment, creator } = req.body;
  const imagesArray = req.files.map((f) => ({
    url: f.path,
    filename: f.filename,
  }));
  const createdPost = new Post({
    images: [...imagesArray],
    comment,
    creator,
  });

  let user;
  try {
    user = await User.findById(creator);
  } catch (err) {
    const error = new HttpError('creating post failed, please try again!', 500);
    return next(error);
  }

  if (!user) {
    const error = new HttpError('Could not find your for provided id', 404);
    return next(error);
  }

  console.log(user);

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await createdPost.save({ session: sess });
    user.posts.push(createdPost);
    await user.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError('Creating post failed, please try again.', 500);
    return next(error);
  }
  res.status(201).json({ post: createdPost });
};

export const updatePost = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors);
    return next(
      new HttpError('Invalid inputs passed, please check your data!', 422)
    );
  }
  console.log('딜리트이미지: ', req.body.deleteImages);
  const postId = req.params.pid;

  let post;
  try {
    post = await Post.findById(postId);
  } catch (err) {
    const error = new HttpError(
      'Something went wrong, Could not update the post',
      500
    );
    return next(error);
  }
  console.log(post.images.length);
  console.log(req.body.deleteImages.length);
  console.log(req.files);
  let imagesArray;
  if (!req.files) {
    if (
      Array.isArray(req.body.deleteImages) &&
      post.images.length === req.body.deleteImages.length
    ) {
      const error = new HttpError('the images has to be at leat one.', 422);
      return next(error);
    } else {
      imagesArray = [];
    }
  } else {
    imagesArray = req.files.map((f) => ({
      url: f.path,
      filename: f.filename,
    }));
  }

  post.images.push(...imagesArray);
  post.comment = req.body.comment;
  try {
    await post.save();
  } catch (err) {
    const error = new HttpError(
      'Something went wrong, could not update post.',
      500
    );
    return next(error);
  }
  if (req.body.deleteImages) {
    for (let filename of req.body.deleteImages) {
      await cloudinary.uploader.destroy(filename);
    }
    await post.updateOne({
      $pull: { images: { filename: { $in: req.body.deleteImages } } },
    });
    console.log(post);
  }
  res.status(200).json({ post: post.toObject({ getters: true }) });
};

export const removePost = async (req, res, next) => {
  const postId = req.params.pid;
  let post;
  try {
    post = await Post.findById(postId).populate('creator');
  } catch (err) {
    const error = new HttpError(
      'Something went wrong, could not delete post.',
      500
    );
    return next(error);
  }

  if (!post) {
    const error = new HttpError('Could not find post for this id.', 404);
    return next(error);
  }

  for (let img of post.images) {
    await cloudinary.uploader.destroy(img.filename);
  }

  await post.updateOne({
    $pull: { images: { filename: { $in: req.body.deleteImages } } },
  });
  console.log(post);

  console.log(post.creator.posts);

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await post.deleteOne({ session: sess });
    post.creator.posts = post.creator.posts.filter(
      (p) => p.toString() !== post._id.toString()
    );
    await post.creator.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError(
      'Something went wrong, could not delete place.',
      500
    );
    return next(error);
  }

  res.status(203).json({ message: 'Post deleted!' });
};
