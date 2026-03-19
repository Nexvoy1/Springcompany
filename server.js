require('dotenv').config();
const express   = require('express');
const mongoose  = require('mongoose');
const helmet    = require('helmet');
const cors      = require('cors');
const morgan    = require('morgan');
const rateLimit = require('express-rate-limit');
const path      = require('path');

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Security ──────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.CLIENT_URL || '*', credentials: true }));

// ── Webhooks (raw body needed) ─────────────────
app.use('/api/webhooks', express.raw({ type: 'application/json' }),
  require('./routes/webhooks'));

// ── Body parsing ───────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));

// ── Rate limiting ──────────────────────────────
app.use('/api/', rateLimit({ windowMs: 15*60*1000, max: 200 }));
app.use('/api/auth/', rateLimit({ windowMs: 15*60*1000, max: 15,
  message: { success: false, message: 'Too many attempts. Try again in 15 minutes.' }
}));

// ── Static uploads ─────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── API Routes ─────────────────────────────────
app.use('/api/auth',        require('./routes/auth'));
app.use('/api/celebrities', require('./routes/celebrities'));
app.use('/api/bookings',    require('./routes/bookings'));
app.use('/api/payments',    require('./routes/payments'));
app.use('/api/fancards',    require('./routes/fancards'));
app.use('/api/users',       require('./routes/users'));
app.use('/api/posts',       require('./routes/posts'));
app.use('/api/messages',    require('./routes/messages'));
app.use('/api/calendar',    require('./routes/calendar'));
app.use('/api/admin',       require('./routes/admin'));

// ── Health ──────────────────────────────────────
app.get('/api/health', (req, res) => res.json({
  status: 'ok', platform: 'Springcompany', timestamp: new Date().toISOString()
}));

// ── Serve frontend in production ───────────────
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'frontend')));
  app.get('*', (req, res) =>
    res.sendFile(path.join(__dirname, 'frontend/index.html')));
}

// ── Error handler ──────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Server error' : err.message
  });
});

// ── Connect & Start ────────────────────────────
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅  MongoDB connected');
    app.listen(PORT, () =>
      console.log(`🌟  Springcompany server on port ${PORT} [${process.env.NODE_ENV}]`));
  })
  .catch(err => { console.error('❌  MongoDB error:', err.message); process.exit(1); });

module.exports = app;
