# ⭐ Springcompany — Celebrity Booking & Profile Platform
## Complete Setup & Deployment Guide

---

## 📁 PROJECT STRUCTURE

```
springcompany/
├── frontend/
│   └── index.html          ← Complete homepage + celebrity profile
├── backend/ (root level)
│   ├── server.js           ← Express app entry point
│   ├── models/
│   │   └── index.js        ← All MongoDB models
│   ├── routes/
│   │   ├── auth.js         ← Register, Login, JWT
│   │   ├── celebrities.js  ← CRUD celebrities
│   │   ├── bookings.js     ← Booking requests
│   │   ├── payments.js     ← Paystack integration
│   │   ├── fancards.js     ← Fan card system
│   │   ├── posts.js        ← Blog posts
│   │   ├── messages.js     ← Contact + newsletter
│   │   ├── calendar.js     ← Availability calendar
│   │   ├── admin.js        ← Admin dashboard API
│   │   ├── users.js        ← User profile + dashboard
│   │   └── webhooks.js     ← Payment webhooks
│   ├── middleware/
│   │   └── auth.js         ← JWT protect + adminOnly
│   ├── package.json
│   ├── vercel.json
│   └── .env.example
```

---

## 🚀 QUICK START (LOCAL)

### Step 1 — Install dependencies
```bash
cd springcompany
npm install
```

### Step 2 — Create your .env file
```bash
cp .env.example .env
```
Fill in MongoDB URI, JWT secret, Paystack keys, email credentials.

### Step 3 — Create upload folders
```bash
mkdir -p uploads/ids uploads/images uploads/videos
```

### Step 4 — Start development server
```bash
npm run dev
```
Server runs at: http://localhost:5000
Frontend at:    http://localhost:5000 (served as static)

### Step 5 — Seed demo data (optional)
```bash
npm run seed
```

---

## 🌐 DEPLOY TO VERCEL

### Step 1 — Push to GitHub
```bash
git init
git add .
git commit -m "Springcompany initial deployment"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/springcompany.git
git push -u origin main
```

### Step 2 — Import on Vercel
1. Go to https://vercel.com → New Project
2. Import your springcompany GitHub repo
3. Framework: Other
4. Root Directory: ./
5. Build Command: npm install
6. Output Directory: frontend

### Step 3 — Add Environment Variables on Vercel
Add all variables from .env.example:
- NODE_ENV = production
- MONGODB_URI = your Atlas connection string
- JWT_SECRET = your 64-char random secret
- PAYSTACK_SECRET_KEY = sk_live_...
- PAYSTACK_PUBLIC_KEY = pk_live_...
- CLIENT_URL = https://springcompany.vercel.app

### Step 4 — Deploy
Click Deploy. Your site goes live in ~2 minutes at:
https://springcompany.vercel.app

---

## 💳 PAYMENT SETUP

### Paystack (Cards + Bank Transfer)
1. Create account at https://paystack.com
2. Go to Settings → API Keys
3. Copy Secret Key + Public Key → paste in .env
4. Set webhook URL in Paystack dashboard:
   https://yoursite.vercel.app/api/webhooks/paystack

### Flutterwave (International)
1. Create account at https://flutterwave.com
2. Go to Settings → API Keys
3. Copy Secret + Public keys → paste in .env

### Bitcoin Payments
Add BTCPay Server (see NEXVOY deployment guide for full instructions)

### Western Union (Manual)
Already built as manual confirmation system in admin dashboard.
Admin receives notification → manually confirms in dashboard → booking activates.

---

## 🗄️ DATABASE COLLECTIONS

| Collection | Purpose |
|-----------|---------|
| users | Fan/admin accounts |
| celebrities | Celebrity profiles |
| bookings | Booking requests |
| payments | Payment records |
| fancards | Fan card subscriptions |
| posts | Blog/trending posts |
| messages | Contact form submissions |
| subscribers | Newsletter list |
| calendars | Celebrity availability |

---

## 🔗 COMPLETE API REFERENCE

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Create account |
| POST | /api/auth/login | Login + get JWT |
| GET | /api/auth/me | Get current user |

### Celebrities
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/celebrities | List all (with filters) |
| GET | /api/celebrities/:id | Get single celebrity |
| POST | /api/celebrities | Create (admin) |
| PUT | /api/celebrities/:id | Update (admin) |
| DELETE | /api/celebrities/:id | Deactivate (admin) |
| PUT | /api/celebrities/:id/verify | Toggle verified (admin) |

### Bookings
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/bookings | Submit booking request |
| GET | /api/bookings/my | User's bookings |
| GET | /api/bookings | All bookings (admin) |
| PUT | /api/bookings/:id/status | Update status (admin) |

### Payments
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/payments/paystack/initialize | Start payment |
| GET | /api/payments/verify/:ref | Verify payment |
| GET | /api/payments/history | Payment history |

### Fan Cards
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/fancards | Purchase fan card |
| GET | /api/fancards/my | User's fan cards |

### Admin Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/admin/stats | Platform statistics |
| GET | /api/admin/users | All users |
| GET | /api/admin/bookings | All bookings |
| GET | /api/admin/payments | All payments |
| GET | /api/admin/fancards | All fan cards |
| PUT | /api/admin/users/:id/role | Change user role |

### Other Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/messages/contact | Send contact message |
| POST | /api/messages/subscribe | Newsletter subscribe |
| GET | /api/calendar/:celebrityId | Get availability |
| POST | /api/calendar | Update availability (admin) |
| POST | /api/webhooks/paystack | Payment webhook |

---

## 🎨 CUSTOMISATION GUIDE

### Change Brand Name
In index.html use Ctrl+H:
- Find: Springcompany
- Replace: Your Platform Name

### Change Color Theme
In index.html find :root{} and update:
- --gold: #D4AF37  → your primary brand color
- --accent: #C084FC → your secondary color
- --bg: #0A0A0F    → your background color

### Add Real Celebrity Images
Replace Unsplash URLs in the CELEBRITIES array in index.html:
```javascript
img: 'img/celebrity-name.jpg'  // put in frontend/img/ folder
```

### Add More Celebrities
In index.html find var CELEBRITIES = [...] and add:
```javascript
{
  id: 9,
  name: 'Celebrity Name',
  occ: 'Singer & Performer',
  cat: 'Music',          // Music|Film|Sports|Comedy|Fashion
  img: 'https://...',
  verified: true,
  dob: 'January 1, 1990',
  age: 35,
  nation: 'American',
  years: '2010–Present',
  fee: '$50,000+',
  bio: 'Short bio here.',
  rating: 4.8,
  bookings: 150
}
```

### Change Payment Currency
Find 'USD' throughout and replace with your currency code (NGN, GBP, EUR etc.)
Also update Paystack currency in routes/payments.js.

---

## 🔐 MAKING YOURSELF ADMIN

After deploying, run this once with your registered email:
```javascript
// In MongoDB Atlas console or via Compass:
db.users.updateOne(
  { email: "your@email.com" },
  { $set: { role: "admin" } }
)
```

Or add this temporary route to server.js (remove after use):
```javascript
app.get('/make-admin/:email', async (req, res) => {
  const User = require('./models').User;
  const user = await User.findOneAndUpdate(
    { email: req.params.email },
    { role: 'admin' },
    { new: true }
  );
  res.json({ user: user?.email, role: user?.role });
});
```
Visit: https://yoursite.com/make-admin/your@email.com

---

## 📱 FEATURES CHECKLIST

### ✅ Already Built
- [x] Stunning homepage with 8-slide hero slideshow
- [x] Celebrity grid with search + category filter
- [x] Individual celebrity profile pages
- [x] Booking request form (12 fields + file upload)
- [x] Fan Card system (Silver/Gold/VIP tiers)
- [x] Auth system (Register/Login/Social)
- [x] Meet & Greet animated section
- [x] Trending posts scrolling ticker
- [x] YouTube video carousel
- [x] About section with statistics
- [x] Contact form
- [x] Newsletter subscription
- [x] Floating WhatsApp + Telegram buttons
- [x] Dark/Light mode toggle
- [x] Hamburger mega menu
- [x] Custom cursor
- [x] Complete REST API (Node.js + Express)
- [x] MongoDB models (10 collections)
- [x] JWT authentication
- [x] Paystack payment integration
- [x] Webhook handler
- [x] Admin dashboard API
- [x] File upload (ID cards)
- [x] Rate limiting + security headers
- [x] Vercel deployment config

### 🔲 Coming Next (Phase 2)
- [ ] Admin dashboard frontend (React)
- [ ] AI chatbot (OpenAI integration)
- [ ] Live chat (Tawk.to or Crisp)
- [ ] Email notifications (booking confirmation)
- [ ] Celebrity availability calendar UI
- [ ] Google OAuth integration
- [ ] Flutterwave payment option
- [ ] SEO meta tags + sitemap
- [ ] Mobile app (React Native)

---

## 🆘 COMMON ISSUES

**Error: Cannot find module**
→ Run: npm install

**MongoDB connection failed**
→ Check MONGODB_URI in .env, whitelist 0.0.0.0/0 in Atlas

**Paystack payment not working**
→ Ensure using live keys (sk_live_) not test keys for production

**File upload failing**
→ Create uploads/ folder: mkdir -p uploads/ids uploads/images

**CORS error**
→ Update CLIENT_URL in .env to match your frontend URL exactly

---

## 💡 TECH STACK SUMMARY

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5 + CSS3 + Vanilla JS |
| Backend | Node.js + Express.js |
| Database | MongoDB Atlas + Mongoose |
| Auth | JWT + bcrypt |
| Payments | Paystack + Webhooks |
| File Upload | Multer |
| Hosting | Vercel (frontend + API) |
| Database Host | MongoDB Atlas (free tier) |
| Fonts | Google Fonts (Bebas Neue + Playfair Display) |
| Icons | Font Awesome 6 |

---

Built with ⭐ by Springcompany Development Team
Support: support@springcompany.com
