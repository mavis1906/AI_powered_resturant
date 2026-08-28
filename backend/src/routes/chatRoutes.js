import express from 'express';

const router= express.Router();

router.post('/', async (req, res) => {
    try {
        const { message } = req.body;
        
        res.status(200).json({
            success: true,
            reply: `AI response placeholder fpr: ${message}`
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

export default router;

