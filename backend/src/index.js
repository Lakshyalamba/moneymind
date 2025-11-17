import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';

const app = express();
const PORT = process.env.PORT || 3333;
app.use(cors());
app.use(express.json());
app.use('/api', authRoutes);

app.listen(PORT, (error) => {
  console.log(error)

  console.log(`Server running on port ${PORT}`);
});