import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/authRoutes.js';
import aiRoutes from './routes/aiRoutes.js';

const app = express();
const PORT = process.env.PORT || 3333;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://127.0.0.1:5173';

app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(cookieParser());

app.use('/api', authRoutes);
app.use('/api', aiRoutes);

app.listen(PORT, (error) => {
  console.log(error);

  console.log(`Server running on port ${PORT}`);
});
