require('dotenv').config();
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;const express   = require('express');
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
// ── PASSPORT SETUP ────────────────────────────
const session = require('express-session');
app.use(session({
  secret: process.env.JWT_SECRET || 'springcompany-session-secret',
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: (process.env.NODE_ENV === 'production' ? process.env.CLIENT_URL : 'http://localhost:5000') + '/api/auth/google/callback'
}, async function(accessToken, refreshToken, profile, done) {
  try {
    const { User } = require('./models/index');
    let user = await User.findOne({ email: profile.emails[0].value });
    if (!user) {
      user = await User.create({
        firstName: profile.name.givenName,
        lastName:  profile.name.familyName || '',
        email:     profile.emails[0].value,
        password:  'google-' + profile.id,
        role:      'user'
      });
    }
    return done(null, user);
  } catch(err) {
    return done(err, null);
  }
})); passport.serializeUser(function(user, done) {
  done(null, user.id);
});
passport.deserializeUser(async function(id, done) {
  try {
    const { User } = require('./models/index');
    const user = await User.findById(id);
    done(null, user);
  } catch(err) {
    done(err, null);
  }
});

// ── GOOGLE AUTH ROUTES ─────────────────────────
app.get('/api/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);

app.get('/api/auth/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/?error=google' }),
  function(req, res) {
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { id: req.user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    const user = {
      firstName: req.user.firstName,
      lastName:  req.user.lastName,
      email:     req.user.email,
      role:      req.user.role
    };
    res.redirect('/?token=' + token + '&user=' + encodeURIComponent(JSON.stringify(user)));
  }
);

// ── Rate limiting ──────────────────────────────
app.use('/api/', rateLimit({ windowMs: 15*60*1000, max: 200 }));
// Strict limiter only on sensitive auth actions — NOT on /me session check
app.use('/api/auth/login',      rateLimit({ windowMs: 15*60*1000, max: 15, message: { success: false, message: 'Too many attempts. Try again in 15 minutes.' } }));
app.use('/api/auth/register',   rateLimit({ windowMs: 15*60*1000, max: 10, message: { success: false, message: 'Too many attempts. Try again in 15 minutes.' } }));
app.use('/api/auth/verify-otp', rateLimit({ windowMs: 15*60*1000, max: 10, message: { success: false, message: 'Too many attempts. Try again in 15 minutes.' } }));
app.use('/api/auth/resend-otp', rateLimit({ windowMs: 15*60*1000, max: 5,  message: { success: false, message: 'Too many attempts. Try again in 15 minutes.' } }));

// ── Static uploads ─────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── API Routes ─────────────────────────────────
app.use('/api/auth',        require('./routes/auth'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/wallet',      require('./routes/wallet'));
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
