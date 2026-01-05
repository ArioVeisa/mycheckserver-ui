import { Router } from 'express';
import { 
  getNotifications, 
  markAsRead, 
  markAllAsRead,
  getNotificationSettings,
  updateNotificationSettings,
  updateWhatsapp 
} from '../controllers/notificationController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', getNotifications);
router.put('/:id/read', markAsRead);
router.put('/read-all', markAllAsRead);
router.get('/settings', getNotificationSettings);
router.put('/settings', updateNotificationSettings);
router.put('/whatsapp', updateWhatsapp);

export default router;
