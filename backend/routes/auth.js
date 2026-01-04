import { Router } from 'express';
import {
  register,
  login,
  getProfile,
  updateProfile,
  updatePassword,
  verifyEmail,
  deleteAccount
} from '../controllers/authController.js';
import { googleCallback } from '../controllers/googleController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleCallback);
router.post('/verify-email', verifyEmail);

router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);
router.put('/password', authenticate, updatePassword);
router.delete('/account', authenticate, deleteAccount);

export default router;
