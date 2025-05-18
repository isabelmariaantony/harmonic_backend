import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { authMiddleware } from './middleware/auth';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import postRoutes from './routes/posts';
import eventRoutes from './routes/events';
import internshipRoutes from './routes/internships';
import resourceRoutes from './routes/resources';
import studySessionRoutes from './routes/studySessions';
import adminRoutes from './routes/admin';

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Public routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

// Protected routes
app.use('/api/users', authMiddleware, userRoutes);
app.use('/api/posts', authMiddleware, postRoutes);
app.use('/api/events', authMiddleware, eventRoutes);
app.use('/api/internships', authMiddleware, internshipRoutes);
app.use('/api/resources', authMiddleware, resourceRoutes);
app.use('/api/study-sessions', authMiddleware, studySessionRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 