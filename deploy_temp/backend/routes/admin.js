import express from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { getUsers, getStats, getVisitorAnalytics, updateUserRole } from '../controllers/adminController.js';

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(requireAdmin);

// Get all users
router.get('/users', getUsers);

// Get dashboard stats
router.get('/stats', getStats);

// Get visitor analytics
router.get('/visitors', getVisitorAnalytics);

// Update user role
router.put('/users/:userId/role', updateUserRole);

export default router;
