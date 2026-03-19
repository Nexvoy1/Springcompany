// payments.js
const express = require('express');
const router  = express.Router();
const https   = require('https');
const { v4: uuid } = require('uuid');
const { Payment, Booking, FanCard } = require('../models');
const { protect, adminOnly } = require('../middleware/auth');

const paystackReq = (method, path, body) => new Promise((res, rej) => {
  const data = body ? JSON.stringify(body) : null;
  const req = https.request({ hostname:'api.paystack.co', path, method, headers:{
    Authorization:`Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
    'Content-Type':'application/json',
    ...(data && {'Content-Length':Buffer.byteLength(data)})
  }}, r => { let d=''; r.on('data',c=>d+=c); r.on('end',()=>res(JSON.parse(d))); });
  req.on('error', rej);
  if (data) req.write(data);
  req.end();
});

router.post('/paystack/initialize', protect, async (req, res) => {
  try {
    const { bookingId, fanCardId, amount, type } = req.body;
    const reference = `SB-${uuid().split('-')[0].toUpperCase()}`;
    const resp = await paystackReq('POST', '/transaction/initialize', {
      email: req.user.email,
      amount: amount * 100,
      reference,
      callback_url: `${process.env.CLIENT_URL}/payment/verify?ref=${reference}`,
      metadata: { bookingId, fanCardId, type, userId: req.user._id }
    });
    if (!resp.status) return res.status(502).json({ success: false, message: resp.message });
    await Payment.create({ user: req.user._id, booking: bookingId, fanCard: fanCardId,
      type: type || 'booking', method: 'paystack', amount, reference });
    res.json({ success: true, paymentUrl: resp.data.authorization_url, reference });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.get('/verify/:reference', protect, async (req, res) => {
  try {
    const resp = await paystackReq('GET', `/transaction/verify/${req.params.reference}`);
    if (!resp.status || resp.data.status !== 'success')
      return res.status(400).json({ success: false, message: 'Payment not successful' });
    const payment = await Payment.findOne({ reference: req.params.reference });
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });
    if (payment.status === 'completed') return res.json({ success: true, message: 'Already verified', payment });
    payment.status = 'completed';
    payment.completedAt = new Date();
    await payment.save();
    if (payment.booking) await Booking.findByIdAndUpdate(payment.booking, { 'payment.status': 'paid', 'payment.paidAt': new Date() });
    if (payment.fanCard) await FanCard.findByIdAndUpdate(payment.fanCard, { active: true, activatedAt: new Date() });
    res.json({ success: true, message: 'Payment verified', payment });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.get('/history', protect, async (req, res) => {
  try {
    const payments = await Payment.find({ user: req.user._id })
      .populate('booking', 'eventName celebrity').sort({ createdAt: -1 });
    res.json({ success: true, payments });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

module.exports = router;
