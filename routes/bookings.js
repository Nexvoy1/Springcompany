const express = require('express');
const router  = express.Router();
const { Booking, Celebrity } = require('../models');
const { protect, adminOnly } = require('../middleware/auth');
const multer  = require('multer');
const path    = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/ids/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// POST create booking
router.post('/', protect, upload.single('idCard'), async (req, res) => {
  try {
    const { celebrity, eventDate, eventName, eventType, budget, organisation,
            jobTitle, email, address, nearestAirport, additionalInfo, paymentMethod } = req.body;
    const celeb = await Celebrity.findById(celebrity);
    if (!celeb) return res.status(404).json({ success: false, message: 'Celebrity not found' });
    const booking = await Booking.create({
      user: req.user._id,
      celebrity,
      eventDate,
      eventName,
      eventType,
      budget: Number(budget),
      organisation,
      jobTitle,
      email,
      address,
      nearestAirport,
      additionalInfo,
      idCardFile: req.file?.filename,
      'payment.method': paymentMethod,
    });
    res.status(201).json({ success: true, booking, message: 'Booking request submitted. We will review within 24 hours.' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// GET user bookings
router.get('/my', protect, async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate('celebrity', 'name image occupation verified')
      .sort({ createdAt: -1 });
    res.json({ success: true, bookings });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// GET all bookings (admin)
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = status ? { status } : {};
    const total = await Booking.countDocuments(filter);
    const bookings = await Booking.find(filter)
      .populate('user', 'firstName lastName email')
      .populate('celebrity', 'name image')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit).limit(Number(limit));
    res.json({ success: true, bookings, total, pages: Math.ceil(total / limit) });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// PUT update booking status (admin)
router.put('/:id/status', protect, adminOnly, async (req, res) => {
  try {
    const { status, adminNotes } = req.body;
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    booking.status = status;
    if (adminNotes) booking.adminNotes = adminNotes;
    if (status === 'confirmed') booking.confirmedAt = new Date();
    await booking.save();
    res.json({ success: true, booking });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

module.exports = router;
