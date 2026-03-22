const express    = require('express');
const jwt        = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { body, validationResult } = require('express-validator');
const { User }   = require('../models');
const { protect } = require('../middleware/auth');
const router     = express.Router();

const sign = id => jwt.sign({ id }, process.env.JWT_SECRET, {
  expiresIn: process.env.JWT_EXPIRES_IN || '7d'
});

// ── EMAIL TRANSPORTER ─────────────────────────
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// ── GENERATE 6 DIGIT OTP ──────────────────────
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ── SEND EMAIL OTP ────────────────────────────
async function sendEmailOTP(email, otp, firstName) {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'Springcompany <noreply@springcompany.com>',
      to: email,
      subject: 'Springcompany — Verify Your Email Address',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:32px;background:#0A0A0F;color:#F0EEF8;border-radius:12px">
          <div style="text-align:center;margin-bottom:24px">
            <h1 style="color:#D4AF37;font-size:28px;letter-spacing:4px;margin:0">SPRINGCOMPANY</h1>
            <p style="color:#8A87A0;font-size:13px;margin-top:4px">The World's Premier Celebrity Booking Platform</p>
          </div>
          <h2 style="color:#F0EEF8;font-size:18px">Hi ${firstName}! 👋</h2>
          <p style="color:#8A87A0;line-height:1.7">Welcome to Springcompany! Please verify your email address using the code below:</p>
          <div style="text-align:center;margin:28px 0">
            <div style="background:#18181F;border:2px solid #D4AF37;border-radius:12px;padding:20px 40px;display:inline-block">
              <span style="font-size:36px;font-weight:900;letter-spacing:10px;color:#D4AF37">${otp}</span>
            </div>
          </div>
          <p style="color:#8A87A0;font-size:13px;text-align:center">This code expires in <strong style="color:#F0EEF8">10 minutes</strong></p>
          <p style="color:#8A87A0;font-size:12px;text-align:center;margin-top:24px">If you did not create a Springcompany account, please ignore this email.</p>
          <div style="text-align:center;margin-top:28px;padding-top:20px;border-top:1px solid #1E1E28">
            <p style="color:#4A4860;font-size:11px">© 2025 Springcompany Entertainment Ltd. All rights reserved.</p>
          </div>
        </div>
      `
    });
  } catch (err) {
    console.error('Email send error:', err.message);
    // Don't throw - email is optional for registration
  }
}

// ── SEND SMS OTP ──────────────────────────────
async function sendSMSOTP(phone, otp) {
  try {
    const twilio = require('twilio');
    const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);
    await client.messages.create({
      body: `Your Springcompany verification code is: ${otp}. Valid for 10 minutes. Do not share this code.`,
      from: process.env.TWILIO_PHONE,
      to: phone
    });
  } catch(e) {
    console.log('SMS error:', e.message);
    // Do not throw — email OTP is the primary method
  }
}

// ══════════════════════════════════════════════
// STEP 1 — REGISTER (saves user, sends OTPs)
// POST /api/auth/register
// ══════════════════════════════════════════════
router.post('/register', [
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  body('username').trim().notEmpty().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('gender').notEmpty().withMessage('Gender is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('phone').notEmpty().withMessage('Phone number is required'),
  body('country').notEmpty().withMessage('Country is required'),
  body('state').notEmpty().withMessage('State is required'),
  body('dateOfBirth').notEmpty().withMessage('Date of birth is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
], async (req, res) => {
  const errs = validationResult(req);
  if (!errs.isEmpty()) return res.status(400).json({
    success: false,
    message: errs.array()[0].msg
  });

  try {
    const {
      firstName, lastName, username, gender,
      email, phone, country, state, lga,
      dateOfBirth, password
    } = req.body;

    // Check if email already registered
    if (await User.findOne({ email })) {
      return res.status(409).json({
        success: false,
        message: 'This email is already registered. Please sign in.'
      });
    }

    // Check if username already taken
    if (await User.findOne({ username: username.toLowerCase() })) {
      return res.status(409).json({
        success: false,
        message: 'This username is already taken. Please choose another.'
      });
    }

    // Generate OTPs
    const emailOTP = generateOTP();
    const phoneOTP = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Create user (not yet verified)
    const user = await User.create({
      firstName, lastName, username: username.toLowerCase(),
      gender, email, phone, country, state, lga,
      dateOfBirth, password,
      emailOTP, phoneOTP, otpExpires,
      emailVerified: false,
      phoneVerified: false,
      isVerified: false
    });

    // Send email and SMS in background (non-blocking)
    sendEmailOTP(email, emailOTP, firstName).catch(err => 
      console.error('Failed to send email OTP after registration:', err.message)
    );
    sendSMSOTP(phone, phoneOTP).catch(err => 
      console.error('Failed to send SMS OTP after registration:', err.message)
    );

    res.status(201).json({
      success: true,
      message: 'Account created! Please check your email and phone for verification codes.',
      userId: user._id,
      email: email,
      phone: phone
    });

  } catch(e) {
    console.error('Register error:', e.message);
    res.status(500).json({ success: false, message: e.message });
  }
});

// ══════════════════════════════════════════════
// STEP 2 — VERIFY EMAIL OTP
// POST /api/auth/verify-email
// ══════════════════════════════════════════════
router.post('/verify-email', async (req, res) => {
  try {
    const { userId, otp } = req.body;

    const user = await User.findById(userId).select('+emailOTP +otpExpires');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (new Date() > user.otpExpires) {
      return res.status(400).json({ success: false, message: 'Code has expired. Please request a new one.' });
    }

    if (user.emailOTP !== otp) {
      return res.status(400).json({ success: false, message: 'Incorrect code. Please try again.' });
    }

    user.emailVerified = true;
    user.emailOTP = undefined;
    await user.save({ validateBeforeSave: false });

    // Check if both verified
    if (user.emailVerified && user.phoneVerified) {
      user.isVerified = true;
      await user.save({ validateBeforeSave: false });
    }

    res.json({
      success: true,
      message: 'Email verified successfully!',
      bothVerified: user.emailVerified && user.phoneVerified
    });

  } catch(e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ══════════════════════════════════════════════
// STEP 3 — VERIFY PHONE OTP
// POST /api/auth/verify-phone
// ══════════════════════════════════════════════
router.post('/verify-phone', async (req, res) => {
  try {
    const { userId, otp } = req.body;

    const user = await User.findById(userId).select('+phoneOTP +otpExpires');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (new Date() > user.otpExpires) {
      return res.status(400).json({ success: false, message: 'Code has expired. Please request a new one.' });
    }

    if (user.phoneOTP !== otp) {
      return res.status(400).json({ success: false, message: 'Incorrect code. Please try again.' });
    }

    user.phoneVerified = true;
    user.phoneOTP = undefined;
    await user.save({ validateBeforeSave: false });

    // If both verified — log them in
    if (user.emailVerified && user.phoneVerified) {
      user.isVerified = true;
      await user.save({ validateBeforeSave: false });

      return res.json({
        success: true,
        message: 'Phone verified! Your account is now active.',
        bothVerified: true,
        token: sign(user._id),
        user: user.toPublic()
      });
    }

    res.json({
      success: true,
      message: 'Phone verified successfully!',
      bothVerified: false
    });

  } catch(e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ══════════════════════════════════════════════
// RESEND OTP
// POST /api/auth/resend-otp
// ══════════════════════════════════════════════
router.post('/resend-otp', async (req, res) => {
  try {
    const { userId, type } = req.body; // type = 'email' or 'phone'

    const user = await User.findById(userId).select('+emailOTP +phoneOTP +otpExpires');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const newOTP = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    if (type === 'email') {
      user.emailOTP = newOTP;
      user.otpExpires = otpExpires;
      await user.save({ validateBeforeSave: false });
      await sendEmailOTP(user.email, newOTP, user.firstName);
      res.json({ success: true, message: 'New verification code sent to your email.' });
    } else {
      user.phoneOTP = newOTP;
      user.otpExpires = otpExpires;
      await user.save({ validateBeforeSave: false });
      await sendSMSOTP(user.phone, newOTP);
      res.json({ success: true, message: 'New verification code sent to your phone.' });
    }

  } catch(e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ══════════════════════════════════════════════
// LOGIN
// POST /api/auth/login
// ══════════════════════════════════════════════
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], async (req, res) => {
  const errs = validationResult(req);
  if (!errs.isEmpty()) return res.status(400).json({
    success: false,
    message: 'Please enter a valid email and password'
  });

  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect email or password'
      });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email and phone number first.',
        needsVerification: true,
        userId: user._id
      });
    }

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    res.json({
      success: true,
      token: sign(user._id),
      user: user.toPublic()
    });

  } catch(e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ── GET CURRENT USER ──────────────────────────
router.get('/me', protect, (req, res) => {
  res.json({ success: true, user: req.user.toPublic() });
});

module.exports = router;