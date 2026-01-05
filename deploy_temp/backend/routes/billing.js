import { Router } from 'express';
import { 
  createPayment, 
  handleNotification, 
  checkPaymentStatus, 
  getPaymentHistory,
  getCurrentPlan,
  confirmPayment 
} from '../controllers/billingController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/notification', handleNotification);

router.use(authenticate);

router.post('/create-payment', createPayment);
router.post('/confirm-payment', confirmPayment);
router.get('/status/:orderId', checkPaymentStatus);
router.get('/history', getPaymentHistory);
router.get('/plan', getCurrentPlan);

export default router;
