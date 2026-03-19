const express = require('express');
const crypto  = require('crypto');
const r = express.Router();
const { Payment, Booking, FanCard } = require('../models');

r.post('/paystack', async (req, res) => {
  try {
    const hash = crypto.createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
      .update(req.body).digest('hex');
    if (hash !== req.headers['x-paystack-signature']) return res.status(401).send('Invalid signature');
    const event = JSON.parse(req.body.toString());
    if (event.event === 'charge.success') {
      const payment = await Payment.findOne({ reference: event.data.reference });
      if (payment && payment.status !== 'completed') {
        payment.status = 'completed';
        payment.completedAt = new Date();
        await payment.save();
        if (payment.booking) await Booking.findByIdAndUpdate(payment.booking, { 'payment.status':'paid', 'payment.paidAt':new Date() });
        if (payment.fanCard) await FanCard.findByIdAndUpdate(payment.fanCard, { active:true, activatedAt:new Date() });
      }
    }
    res.status(200).send('OK');
  } catch (e) { console.error('Webhook error:', e); res.status(500).send('Error'); }
});

module.exports = r;
