import express from 'express';

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        res.status(200).json({
            success: true,
            message: 'Analytics data retrieved successfully',
            data: {
              totalOrders: 0,
             totalRevenue: 0,
             popularItems: []
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message});
    }
});

export default router;