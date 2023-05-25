import express from 'express';
import { check } from 'express-validator';
import { v1 as uuidv1 } from 'uuid';
import multer from 'multer';
import { storage } from '../cloudinary/index.js';
import * as UsersControllers from '../controllers/users-controllers.js';

const upload = multer({ storage });
const router = express.Router();

router.post(
  '/signup',
  upload.single('avatar'),
  [
    check('name').not().isEmpty(),
    check('email').normalizeEmail().isEmail(),
    check('password').isLength({ min: 6 }),
  ],
  UsersControllers.registerUser
);

router.post('/login', UsersControllers.loginUser);

export default router;
