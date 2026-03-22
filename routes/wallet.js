const express = require('express');
const { User } = require('../models');
const protect = require('../middleware/auth').protect;

const router = express.Router();

// Get wallet balance
router.get('/balance', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const walletBalance = Math.max(0, 1000 - ((user.totalSpent || 0) % 1000));
    
    res.json({
      success: true,
      balance: walletBalance,
      totalSpent: user.totalSpent || 0
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// Get wallet transactions
router.get('/transactions', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate({
        path: 'bookings',
        select: 'amount status createdAt celebrity',
        populate: { path: 'celebrity', select: 'name' }
      })
      .populate({
        path: 'fanCards',
        select: 'price tier createdAt celebrity',
        populate: { path: 'celebrity', select: 'name' }
      });

    const transactions = [
      ...(user.bookings || []).map(b => ({
        id: b._id,
        type: 'booking',
        amount: b.amount || 0,
        status: b.status,
        description: `Booking - ${b.celebrity?.name || 'Celebrity'}`,
        date: b.createdAt
      })),
      ...(user.fanCards || []).map(f => ({
        id: f._id,
        type: 'fancard',
        amount: f.price || 0,
        status: 'completed',
        description: `Fan Card - ${f.celebrity?.name || 'Celebrity'}`,
        date: f.createdAt
      }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({
      success: true,
      transactions,
      count: transactions.length
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// Process wallet deposit
router.post('/deposit', protect, async (req, res) => {
  try {
    const { amount, method } = req.body;

    if (!amount || amount < 10) {
      return res.status(400).json({
        success: false,
        message: 'Minimum deposit is $10'
      });
    }

    const validMethods = ['paystack', 'flutterwave', 'bank', 'crypto', 'union', 'apple'];
    if (!validMethods.includes(method)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment method'
      });
    }

    // Log the deposit request (in production, would create Payment record)
    console.log(`Deposit request: User ${req.user._id}, Amount: $${amount}, Method: ${method}`);

    res.json({
      success: true,
      message: 'Deposit request received',
      amount: amount,
      method: method,
      status: 'pending'
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// Process wallet withdrawal
router.post('/withdraw', protect, async (req, res) => {
  try {
    const { amount, bankName, accountNumber, accountName } = req.body;

    if (!amount || amount < 10) {
      return res.status(400).json({
        success: false,
        message: 'Minimum withdrawal is $10'
      });
    }

    if (!bankName || !accountNumber || !accountName) {
      return res.status(400).json({
        success: false,
        message: 'All bank details are required'
      });
    }

    const user = await User.findById(req.user._id);
    const walletBalance = Math.max(0, 1000 - ((user.totalSpent || 0) % 1000));

    if (amount > walletBalance) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient wallet balance'
      });
    }

    // Log the withdrawal request (in production, would create Withdrawal record and process)
    console.log(`Withdrawal request: User ${req.user._id}, Amount: $${amount}, Bank: ${bankName}, Account: ${accountNumber}`);

    res.json({
      success: true,
      message: 'Withdrawal request submitted for processing',
      amount: amount,
      bankName: bankName,
      accountNumber: accountNumber,
      status: 'pending_review',
      estimatedTime: '1-3 business days'
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// Add money via payment provider
router.post('/add-funds', protect, async (req, res) => {
  try {
    const { amount, paymentMethod } = req.body;

    if (!amount || amount < 10) {
      return res.status(400).json({
        success: false,
        message: 'Minimum amount is $10'
      });
    }

    const validMethods = ['paystack', 'flutterwave', 'bank', 'crypto'];
    if (!validMethods.includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment method'
      });
    }

    // In production, would initiate actual payment with provider
    const paymentProviders = {
      paystack: {
        provider: 'Paystack',
        fee: Math.round(amount * 0.015 * 100) / 100, // 1.5% fee
        total: amount + (Math.round(amount * 0.015 * 100) / 100)
      },
      flutterwave: {
        provider: 'Flutterwave',
        fee: Math.round(amount * 0.019 * 100) / 100, // 1.9% fee
        total: amount + (Math.round(amount * 0.019 * 100) / 100)
      },
      bank: {
        provider: 'Bank Transfer',
        fee: 5, // Fixed $5 fee
        total: amount + 5
      },
      crypto: {
        provider: 'Cryptocurrency',
        fee: 0, // No fee
        total: amount
      }
    };

    const provider = paymentProviders[paymentMethod];

    res.json({
      success: true,
      message: 'Payment initiated',
      amount: amount,
      fee: provider.fee,
      total: provider.total,
      provider: provider.provider,
      referenceId: `WAL-${Date.now()}`,
      status: 'pending_payment'
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// Get wallet history/summary
router.get('/summary', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('bookings')
      .populate('fanCards');

    const spent = user.totalSpent || 0;
    const walletBalance = Math.max(0, 1000 - (spent % 1000));
    const bookingCount = (user.bookings || []).length;
    const fanCardCount = (user.fanCards || []).length;

    // Calculate monthly spending
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthlySpend = (user.bookings || [])
      .filter(b => {
        const date = new Date(b.createdAt);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      })
      .reduce((sum, b) => sum + (b.amount || 0), 0);

    // Determine rank
    let rank = 'Regular';
    if (spent >= 50000) rank = 'VIP';
    else if (spent >= 5000) rank = 'Gold';
    else if (spent >= 500) rank = 'Silver';

    res.json({
      success: true,
      wallet: {
        balance: walletBalance,
        totalSpent: spent,
        monthlySpending: monthlySpend,
        rank: rank,
        bookings: bookingCount,
        fanCards: fanCardCount,
        totalTransactions: bookingCount + fanCardCount
      }
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

module.exports = router;