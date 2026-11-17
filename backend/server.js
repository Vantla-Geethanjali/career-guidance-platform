
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import db from './config/db.js';

import authRoutes from './routes/auth.js';
import careerRoutes from './routes/careers.js';
import profileRoutes from './routes/profile.js';
import courseRoutes from './routes/courses.js';
import aiRoutes from './routes/ai.js';

dotenv.config();

const app = express();

app.use(cors({
  origin: 'http://localhost:5173'
}));

app.use(express.json());

// Health check
app.get('/api/health', async (_req, res) => {
  try {
    await db.query('SELECT 1');

    res.json({
      success: true,
      message: 'CareerPath AI API and database are connected'
    });

  } catch (error) {
    console.error('Database connection error:', error.message);

    res.status(500).json({
      success: false,
      message: 'Database connection failed'
    });
  }
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/careers', careerRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/ai', aiRoutes);

// Start server
const port = process.env.PORT || 5001;

app.listen(port, () => {
  console.log(
    `CareerPath AI backend running on http://localhost:${port}`
  );
});
