import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import apiRouter from './src/routes/api.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/api', apiRouter);
app.get('/', (req, res) => {
  res.send('Live backend server is running successfully.');
});
app.listen(PORT, () => {
  console.log(`Server is live and listening on port ${PORT}`);
});