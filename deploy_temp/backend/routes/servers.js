import { Router } from 'express';
import { 
  getServers, 
  getServer, 
  createServer, 
  updateServer, 
  deleteServer,
  checkServerNow 
} from '../controllers/serverController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', getServers);
router.get('/:id', getServer);
router.post('/', createServer);
router.put('/:id', updateServer);
router.delete('/:id', deleteServer);
router.post('/:id/check', checkServerNow);

export default router;
