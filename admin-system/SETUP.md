# Admin Dashboard - Complete Setup Guide

This guide walks you through setting up the complete Springcompany Admin Dashboard (backend + frontend).

---

## Table of Contents

1. [Backend Setup](#backend-setup)
2. [Frontend Setup](#frontend-setup)
3. [Database Setup](#database-setup)
4. [Running the System](#running-the-system)
5. [Deployment](#deployment)

---

## Backend Setup

### Step 1: Navigate to Backend Directory
```bash
cd admin-system/backend
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Configure Environment Variables
Create `.env` file:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/springcompany
JWT_SECRET=your_jwt_secret_key_here_min_32_chars
JWT_REFRESH_SECRET=your_refresh_secret_key_min_32_chars
CORS_ORIGIN=http://localhost:3000,http://localhost:3001
```

### Step 4: Initialize Database
```bash
npm run seed
```

This creates:
- 7 default roles (Super Admin, Admin, Content Manager, Editor, Moderator, Viewer, User)
- 1 default admin user (email: admin@springcompany.com, password: admin123456)

### Step 5: Start Backend Server
```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

✅ Backend running on: **http://localhost:5000**

---

## Frontend Setup

### Step 1: Create React App
```bash
cd admin-system/frontend
npx create-react-app .
# or for TypeScript: npx create-react-app . --template typescript
```

### Step 2: Install UI & Utility Packages
```bash
npm install \
  react-router-dom \
  axios \
  react-query \
  tailwindcss \
  shadcn-ui \
  zustand \
  date-fns \
  react-icons \
  framer-motion
```

### Step 3: Configure Tailwind CSS
```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

Update `tailwind.config.js`:
```js
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#FFD700", // Gold
        dark: "#1a1a1a",
      }
    },
  },
  plugins: [],
}
```

### Step 4: Configure Environment Variables
Create `.env`:
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_APP_NAME=Springcompany Admin
```

### Step 5: Build Project Structure
```bash
mkdir -p src/{components,pages,services,hooks,store,utils,context}

# Create main components
touch src/{components,pages}/{index.js} src/services/api.js src/store/authStore.js
```

### Step 6: Create API Service
Create `src/services/api.js`:
```javascript
import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
});

// Add token to headers
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;
```

### Step 7: Start Frontend
```bash
npm start
```

✅ Frontend running on: **http://localhost:3000**

---

## Database Setup

### Option 1: Local MongoDB
```bash
# Install MongoDB
# https://docs.mongodb.com/manual/installation/

# Start MongoDB
mongod

# Run seed script
cd admin-system/backend
npm run seed
```

### Option 2: MongoDB Atlas (Cloud)

1. Go to https://www.mongodb.com/cloud/atlas
2. Create free account
3. Create project and cluster
4. Add current IP to whitelist
5. Create database user
6. Get connection string
7. Update `.env`:
```env
MONGODB_URI=mongodb+srv://username:password@cluster-url/springcompany?retryWrites=true&w=majority
```

---

## Running the System

### Terminal 1 - Backend Server
```bash
cd admin-system/backend
npm run dev
```

### Terminal 2 - Frontend App
```bash
cd admin-system/frontend
npm start
```

### Terminal 3 - Tests (Optional)
```bash
cd admin-system/frontend
npm test
```

---

## Testing Login

1. Open **http://localhost:3000** in browser
2. Login with:
   - **Email:** admin@springcompany.com
   - **Password:** admin123456

---

## API Testing

### Using cURL
```bash
# Health check
curl http://localhost:5000/api/health

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@springcompany.com",
    "password": "admin123456"
  }'
```

### Using Postman
1. Download Postman: https://www.postman.com
2. Create new collection
3. Import API endpoints
4. Use Authorization tab → Bearer Token
5. Test endpoints

---

## Directory Structure

```
admin-system/
├── backend/
│   ├── models/              # Database schemas
│   ├── routes/              # API endpoints
│   ├── middleware/          # Auth & error handling
│   ├── config/              # Database config
│   ├── server.js            # Express app
│   ├── package.json
│   ├── .env                 # Local config
│   └── README.md            # API documentation
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components
│   │   ├── services/        # API services
│   │   ├── hooks/           # Custom hooks
│   │   ├── store/           # State management
│   │   ├── utils/           # Helper functions
│   │   ├── App.js
│   │   └── index.js
│   ├── package.json
│   ├── .env                 # Frontend config
│   └── tailwind.config.js
│
├── seed.js                  # Database initialization
└── SETUP.md                 # This file
```

---

## Common Issues & Fixes

### Port Already in Use
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9     # macOS/Linux
netstat -ano | findstr :5000      # Windows
```

### CORS Errors
- Check `CORS_ORIGIN` includes your frontend URL
- Example: `CORS_ORIGIN=http://localhost:3000`

### MongoDB Connection Error
```bash
# Check MongoDB is running
# macOS
brew services list

# Linux
systemctl status mongod

# Windows
net start MongoDB
```

### Seed Script Fails
```bash
# Ensure backend packages installed
cd admin-system/backend
npm install

# Check MongoDB connection string
cat .env | grep MONGODB_URI
```

---

## Production Deployment

### Backend (Heroku Example)
```bash
cd admin-system/backend

# Login to Heroku
heroku login

# Create app
heroku create springcompany-admin-api

# Set environment variables
heroku config:set JWT_SECRET=<strong-secret>
heroku config:set MONGODB_URI=<mongodb-atlas-uri>

# Deploy
git push heroku main
```

### Frontend (Vercel Example)
```bash
cd admin-system/frontend

# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Environment Variables for Production
```env
# Backend
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/springcompany
JWT_SECRET=<strong-32-char-secret>
JWT_REFRESH_SECRET=<strong-32-char-secret>
CORS_ORIGIN=https://yourdomain.com

# Frontend
REACT_APP_API_URL=https://api.yourdomain.com
```

---

## Next Steps

1. ✅ **Backend API** - Completed
   - Authentication routes
   - User management
   - Content management
   - Role-based access control
   - Activity logging

2. 🔄 **Frontend Components** - Ready to build
   - Login page
   - Dashboard
   - User management UI
   - Content editor
   - Settings panel

3. 🔄 **Real-time Features** (Optional)
   - WebSocket with Socket.io
   - Real-time notifications
   - Live dashboard updates

4. 🔄 **Additional Features**
   - File upload system
   - Email notifications
   - Advanced analytics
   - Backup & restore

---

## Support & Documentation

- **API Documentation:** `admin-system/backend/README.md`
- **Backend Setup:** This section
- **Frontend Setup:** This section

---

**Setup Status:** ✅ Complete

**Next Action:** Start building React frontend components!
