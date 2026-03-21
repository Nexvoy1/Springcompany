const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

// ══════════════════════════════════════════════
// USER MODEL
// ══════════════════════════════════════════════
const userSchema = new mongoose.Schema({
  firstName:    { type: String, required: true, trim: true },
  lastName:     { type: String, required: true, trim: true },
  username:     { type: String, required: true, unique: true, trim: true, lowercase: true },
  gender:       { type: String, enum: ['male','female','other','prefer_not_to_say'], required: true },
  email:        { type: String, required: true, unique: true, lowercase: true },
  phone:        { type: String, required: true },
  country:      { type: String, required: true },
  state:        { type: String, required: true },
  lga:          { type: String },
  dateOfBirth:  { type: Date, required: true },
  password:     { type: String, required: true, minlength: 8, select: false },
  avatar:       String,
  role:         { type: String, enum: ['user','admin','celebrity'], default: 'user' },
  isVerified:   { type: Boolean, default: false },
  emailVerified:{ type: Boolean, default: false },
  phoneVerified:{ type: Boolean, default: false },
  emailOTP:     { type: String, select: false },
  phoneOTP:     { type: String, select: false },
  otpExpires:   { type: Date, select: false },
  fanCards:     [{ type: mongoose.Schema.Types.ObjectId, ref: 'FanCard' }],
  bookings:     [{ type: mongoose.Schema.Types.ObjectId, ref: 'Booking' }],
  lastLogin:    Date,
}, { timestamps: true });

// ══════════════════════════════════════════════
// CELEBRITY MODEL
// ══════════════════════════════════════════════
const celebSchema = new mongoose.Schema({
  name:         { type: String, required: true },
  slug:         { type: String, unique: true },
  occupation:   { type: String, required: true },
  category:     { type: String, enum: ['Music','Film','Sports','Comedy','Fashion','TV','Other'], required: true },
  bio:          { type: String, required: true },
  image:        String,
  coverImage:   String,
  gallery:      [String],
  dob:          String,
  age:          Number,
  nationality:  String,
  yearsActive:  String,
  baseFee:      String,
  verified:     { type: Boolean, default: false },
  rating:       { type: Number, default: 4.5, min: 0, max: 5 },
  totalBookings:{ type: Number, default: 0 },
  socialLinks:  { instagram: String, twitter: String, facebook: String, youtube: String },
  tags:         [String],
  featured:     { type: Boolean, default: false },
  active:       { type: Boolean, default: true },
}, { timestamps: true });

celebSchema.pre('save', function(next) {
  if (this.name && !this.slug) {
    this.slug = this.name.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'');
  }
  next();
});
const Celebrity = mongoose.model('Celebrity', celebSchema);

// ══════════════════════════════════════════════
// BOOKING MODEL
// ══════════════════════════════════════════════
const bookingSchema = new mongoose.Schema({
  user:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  celebrity:    { type: mongoose.Schema.Types.ObjectId, ref: 'Celebrity', required: true },
  eventDate:    { type: Date, required: true },
  eventName:    { type: String, required: true },
  eventType:    { type: String, required: true },
  budget:       { type: Number, required: true },
  organisation: String,
  jobTitle:     String,
  email:        { type: String, required: true },
  address:      String,
  nearestAirport: String,
  additionalInfo: String,
  idCardFile:   String,
  status: {
    type: String,
    enum: ['pending','reviewing','approved','rejected','confirmed','completed','cancelled'],
    default: 'pending'
  },
  payment: {
    method:   String,
    status:   { type: String, enum: ['unpaid','paid','refunded'], default: 'unpaid' },
    amount:   Number,
    currency: { type: String, default: 'USD' },
    ref:      String,
    paidAt:   Date,
  },
  adminNotes:   String,
  confirmedAt:  Date,
}, { timestamps: true });
const Booking = mongoose.model('Booking', bookingSchema);

// ══════════════════════════════════════════════
// PAYMENT MODEL
// ══════════════════════════════════════════════
const paymentSchema = new mongoose.Schema({
  user:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  booking:    { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
  fanCard:    { type: mongoose.Schema.Types.ObjectId, ref: 'FanCard' },
  type:       { type: String, enum: ['booking','fancard','meetgreet'], required: true },
  method:     { type: String, enum: ['paystack','flutterwave','bitcoin','western_union','bank_transfer'], required: true },
  amount:     { type: Number, required: true },
  currency:   { type: String, default: 'USD' },
  status:     { type: String, enum: ['pending','completed','failed','refunded'], default: 'pending' },
  reference:  String,
  providerRef: String,
  metadata:   mongoose.Schema.Types.Mixed,
  completedAt: Date,
}, { timestamps: true });
const Payment = mongoose.model('Payment', paymentSchema);

// ══════════════════════════════════════════════
// FAN CARD MODEL
// ══════════════════════════════════════════════
const fanCardSchema = new mongoose.Schema({
  user:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  celebrity:  { type: mongoose.Schema.Types.ObjectId, ref: 'Celebrity', required: true },
  tier:       { type: String, enum: ['Silver','Gold','VIP'], required: true },
  price:      { type: Number, required: true },
  active:     { type: Boolean, default: false },
  activatedAt: Date,
  expiresAt:  Date,
  benefits:   [String],
  cardNumber: String,
}, { timestamps: true });
const FanCard = mongoose.model('FanCard', fanCardSchema);

// ══════════════════════════════════════════════
// POST MODEL
// ══════════════════════════════════════════════
const postSchema = new mongoose.Schema({
  title:      { type: String, required: true },
  content:    String,
  excerpt:    String,
  image:      String,
  category:   String,
  author:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  celebrity:  { type: mongoose.Schema.Types.ObjectId, ref: 'Celebrity' },
  published:  { type: Boolean, default: true },
  featured:   { type: Boolean, default: false },
  views:      { type: Number, default: 0 },
  tags:       [String],
}, { timestamps: true });
const Post = mongoose.model('Post', postSchema);

// ══════════════════════════════════════════════
// MESSAGE MODEL
// ══════════════════════════════════════════════
const messageSchema = new mongoose.Schema({
  name:     { type: String, required: true },
  email:    { type: String, required: true },
  subject:  String,
  message:  { type: String, required: true },
  read:     { type: Boolean, default: false },
  replied:  { type: Boolean, default: false },
}, { timestamps: true });
const Message = mongoose.model('Message', messageSchema);

// ══════════════════════════════════════════════
// SUBSCRIBER MODEL
// ══════════════════════════════════════════════
const subscriberSchema = new mongoose.Schema({
  email:    { type: String, required: true, unique: true },
  active:   { type: Boolean, default: true },
}, { timestamps: true });
const Subscriber = mongoose.model('Subscriber', subscriberSchema);

// ══════════════════════════════════════════════
// CALENDAR AVAILABILITY MODEL
// ══════════════════════════════════════════════
const calendarSchema = new mongoose.Schema({
  celebrity:  { type: mongoose.Schema.Types.ObjectId, ref: 'Celebrity', required: true },
  date:       { type: Date, required: true },
  available:  { type: Boolean, default: true },
  booking:    { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
  note:       String,
}, { timestamps: true });
const Calendar = mongoose.model('Calendar', calendarSchema);

module.exports = { User, Celebrity, Booking, Payment, FanCard, Post, Message, Subscriber, Calendar };
