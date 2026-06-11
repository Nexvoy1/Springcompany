import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { connectDB } from './config/database.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import contentRoutes from './routes/content.js';
import roleRoutes from './routes/roles.js';
import settingsRoutes from './routes/settings.js';
import { authenticate } from './middleware/auth.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ═════════════════════════════
// MIDDLEWARE
// ═════════════════════════════
app.use(cors({
  origin: (process.env.CORS_ORIGIN || 'http://localhost:3000').split(','),
  credentials: true,
  optionsSuccessStatus: 200
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(morgan('combined'));

// ═════════════════════════════
// DATABASE CONNECTION
// ═════════════════════════════
connectDB().catch(err => {
  console.error('❌ Database connection failed:', err.message);
  process.exit(1);
});

// ═════════════════════════════
// HEALTH CHECK
// ═════════════════════════════
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ═════════════════════════════
// ROUTES
// ═════════════════════════════
app.use('/api/auth', authRoutes);
app.use('/api/users', authenticate, userRoutes); // Users routes require authentication
app.use('/api/content', contentRoutes); // Content can be public (published only) or private
app.use('/api/roles', roleRoutes);
app.use('/api/settings', settingsRoutes);

// ═════════════════════════════
// 404 & ERROR HANDLING
// ═════════════════════════════
app.use(notFound);
app.use(errorHandler);

// ═════════════════════════════
// START SERVER
// ═════════════════════════════
app.listen(PORT, () => {
  console.log(`
    ╔════════════════════════════════════╗
    ║  🚀 SPRINGCOMPANY ADMIN API        ║
    ║  ✓ Server running on port ${PORT}    ║
    ║  ✓ Environment: ${process.env.NODE_ENV}        ║
    ║  ✓ API: http://localhost:${PORT}/api ║
    ╚════════════════════════════════════╝
  `);
});

export default app;
