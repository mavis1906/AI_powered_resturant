import express from 'express';

import { handleChatMessage } from '../controllers/chatController.js';
import { getOrders, createOrder } from '../controllers/orderController.js';
import { getMenu, addMenuItem } from '../controllers/menuController.js';
import { getAnalytics } from '../controllers/analyticsController.js';

import chatRoutes from './chatRoutes.js';
import analyticsRoutes from './analyticsRoutes.js';
import menuRoutes from './menuRoutes.js';
import orderRoutes from './orderRoutes.js';

const router = express.Router();

router.post('/chat/direct', handleChatMessage);
router.get('/orders/direct', getOrders);
router.post('/orders/direct', createOrder);
router.get('/menu/direct', getMenu);
router.post('/menu/direct', addMenuItem);
router.get('/analytics/direct', getAnalytics);

router.use('/chat', chatRoutes);
router.use('/orders', orderRoutes);
router.use('/menu', menuRoutes);
router.use('/analytics', analyticsRoutes);


export default router;