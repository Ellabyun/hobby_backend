import express from 'express';
import { check } from 'express-validator';
import multer from 'multer';
import { storage } from '../cloudinary/index.js';
import * as PostsControllers from '../controllers/posts-controllers.js';
import checkAuth from '../middleware/check-auth.js';
const upload = multer({ storage });
const router = express.Router();

router.get('/', PostsControllers.getPosts);

router.get('/:pid', PostsControllers.getPostById);

router.get('/users/:uid', PostsControllers.getPostsByUserId);

router.use(checkAuth);

router.post(
  '/',
  upload.array('images'),
  check('comment').isLength({ min: 5 }),
  PostsControllers.createPost
);

router.patch(
  '/:pid',
  upload.array('images'),
  check('comment').isLength({ min: 5 }),
  PostsControllers.updatePost
);

router.delete('/:pid', PostsControllers.removePost);

export default router;
