# 🎬 Springcompany Admin Dashboard

A production-ready admin management system with full authentication, role-based access control, content management, and activity logging. Built with **Node.js**, **Express**, **MongoDB**, and **React**.

---

## 🌟 Key Features

✅ **Authentication & Security**
- JWT-based authentication (access + refresh tokens)
- Bcryptjs password hashing (10 salt rounds)
- Account locking after 5 failed attempts
- Secure password change & reset
- CORS protection & request validation

✅ **User Management**
- User CRUD with soft delete
- Role assignment & management
- User activity tracking
- Login history & statistics

✅ **Role-Based Access Control (RBAC)**
- 7 pre-configured roles
- Fine-grained permission matrix
- Feature-based authorization
- Role hierarchy system

✅ **Content Management System (CMS)**
- Create, edit, publish content
- Draft & publish workflow
- Auto-slug generation
- Multiple content categories
- View & like tracking

✅ **Activity Logging**
- Track all CRUD operations
- User action history
- IP address & user agent tracking
- 90-day auto-archival

✅ **Settings Management**
- Application-wide configuration
- Categorized settings
- Audit trail for changes
- Per-setting version control

---

## 🚀 Getting Started

### Quick Start (5 minutes)

1. **Clone & Setup Backend**
   ```bash
   cd admin-system/backend
   npm install
   cp .env.example .env
   npm run seed
   npm run dev
   ```

2. **Setup Frontend**
   ```bash
   cd admin-system/frontend
   npm install
   npm start
   ```

3. **Default Credentials**
   - Email: `admin@springcompany.com`
   - Password: `admin123456`

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [SETUP.md](./SETUP.md) | Complete installation & deployment guide |
| [CREDENTIALS.md](./CREDENTIALS.md) | Credentials, roles & quick reference |
| [backend/README.md](./backend/README.md) | API documentation & endpoints |
| [API Collection](#api-collection) | Postman collection (coming soon) |

---

## 📁 Project Structure

```
admin-system/
├── backend/
│   ├── models/              # Database schemas
│   │   ├── User.js         # User authentication & profile
│   │   ├── Role.js         # RBAC roles & permissions
│   │   ├── Content.js      # CMS content management
│   │   ├── ActivityLog.js  # Activity audit trail
│   │   └── Setting.js      # App settings & configuration
│   │
│   ├── routes/              # API endpoints
│   │   ├── auth.js         # Authorization (login, register, refresh)
│   │   ├── users.js        # User management CRUD
│   │   ├── content.js      # Content management CRUD
│   │   ├── roles.js        # Role management
│   │   └── settings.js     # Settings management
│   │
│   ├── middleware/          # Custom middleware
│   │   ├── auth.js         # JWT verification & RBAC
│   │   └── errorHandler.js # Global error handling
│   │
│   ├── config/
│   │   └── database.js     # MongoDB connection
│   │
│   ├── server.js            # Express app entry
│   ├── package.json
│   ├── .env                 # Environment config
│   └── README.md            # API documentation
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Page layouts
│   │   ├── services/        # API client
│   │   ├── hooks/           # Custom hooks
│   │   ├── store/           # State management
│   │   └── utils/           # Utilities
│   ├── package.json
│   └── .env
│
├── seed.js                  # Database initialization
├── SETUP.md                 # Setup & deployment guide
├── CREDENTIALS.md           # Credentials & quick reference
└── README.md                # This file
```

---

## 🔑 Default Roles

| Role | Level | Access |
|------|-------|--------|
| **Super Admin** | 100 | Full system access |
| **Admin** | 80 | User & content management |
| **Content Manager** | 60 | All content operations |
| **Editor** | 40 | Own content creation |
| **Moderator** | 30 | Content moderation |
| **Viewer** | 10 | Read-only access |
| **User** | 1 | Profile & published content |

---

## 🔐 Security Features

```
┌─────────────────────────────────────────┐
│         Security Architecture           │
├─────────────────────────────────────────┤
│ ✓ JWT Authentication (12h access)      │
│ ✓ Refresh Tokens (7d validity)         │
│ ✓ Bcryptjs Password Hashing            │
│ ✓ Account Locking (5 attempts)         │
│ ✓ CORS Protection                      │
│ ✓ Request Validation                   │
│ ✓ Rate Limiting (per-user)             │
│ ✓ Activity Audit Trail                 │
│ ✓ Soft Deletes (data preservation)    │
└─────────────────────────────────────────┘
```

---

## 🌐 API Overview

### Authentication Endpoints
```
POST   /api/auth/register           - Create new account
POST   /api/auth/login              - Login user
POST   /api/auth/refresh-token      - Get new access token
POST   /api/auth/logout             - Logout user
POST   /api/auth/change-password    - Change password
POST   /api/auth/forgot-password    - Reset password
```

### User Management
```
GET    /api/users                   - Get all users (paginated)
GET    /api/users/:id               - Get user details
PUT    /api/users/:id               - Update user profile
PUT    /api/users/:id/role          - Change user role
PUT    /api/users/:id/toggle-active - Activate/deactivate user
DELETE /api/users/:id               - Delete user (soft delete)
GET    /api/users/:id/activity      - Get user activity logs
```

### Content Management
```
GET    /api/content                 - Get all content
GET    /api/content/:id             - Get content details
POST   /api/content                 - Create content
PUT    /api/content/:id             - Update content
POST   /api/content/:id/publish     - Publish content
DELETE /api/content/:id             - Delete content
POST   /api/content/:id/like        - Like/unlike content
```

### Role Management
```
GET    /api/roles                   - Get all roles
GET    /api/roles/:id               - Get role details
POST   /api/roles                   - Create role
PUT    /api/roles/:id               - Update role
DELETE /api/roles/:id               - Delete role
```

### Settings Management
```
GET    /api/settings                - Get all settings
GET    /api/settings/:key           - Get setting value
POST   /api/settings                - Create setting
PUT    /api/settings/:key           - Update setting
DELETE /api/settings/:key           - Delete setting
```

---

## 📊 Database Models

### User Schema
```javascript
{
  firstName, lastName, email, password (hashed),
  phone, avatar,
  role: { ref: 'Role' },
  isActive, isDeleted,
  lastLogin, loginAttempts, lockedUntil,
  createdAt, updatedAt
}
```

### Role Schema
```javascript
{
  name, level, description,
  permissions: [{
    feature: string,
    actions: [string]
  }]
}
```

### Content Schema
```javascript
{
  title, slug (auto-generated),
  category (News, Blog, Page, Announcement, Celebrity Info),
  content (rich HTML),
  author: { ref: 'User' },
  status (Draft, Published, Archived),
  publishedAt, tags, views, likes, likedBy,
  createdAt, updatedAt
}
```

### ActivityLog Schema
```javascript
{
  user: { ref: 'User' },
  action (CREATE, READ, UPDATE, DELETE, LOGIN, LOGOUT),
  entityType, entityId, entityTitle,
  changes, ipAddress, userAgent,
  status (Success, Failed),
  details,
  createdAt (expires after 90 days)
}
```

###Setting Schema
```javascript
{
  key (unique, lowercase),
  value (any type),
  type (String, Number, Boolean, JSON),
  description, category,
  updatedBy: { ref: 'User' },
  createdAt, updatedAt
}
```

---

## 🛠️ Tech Stack

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB + Mongoose
- **Authentication:** JWT + bcryptjs
- **Validation:** express-validator
- **API:** RESTful JSON API
- **Logging:** Morgan

### Frontend (Ready to build)
- **Framework:** React.js
- **Routing:** React Router
- **Styling:** Tailwind CSS
- **UI Components:** ShadCN UI / Material UI
- **State:** Zustand / Redux Toolkit
- **API Client:** Axios
- **Queries:** React Query

---

## 🚀 Deployment Ready

### Supported Platforms
- ✅ **Heroku** - Platform as a Service
- ✅ **Vercel** - Frontend hosting
- ✅ **MongoDB Atlas** - Cloud database
- ✅ **Render** - Full-stack hosting
- ✅ **AWS EC2** - Virtual machines
- ✅ **DigitalOcean** - Cloud VPS

### Environment Setup
```env
# Backend production
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=<strong-secret>
JWT_REFRESH_SECRET=<strong-secret>
CORS_ORIGIN=https://yourdomain.com

# Frontend production
REACT_APP_API_URL=https://api.yourdomain.com
```

---

## 📖 How to Use

### 1. Setup Backend Server
```bash
cd admin-system/backend
npm install
npm run seed        # Initialize database
npm run dev        # Start development server
```

### 2. Setup Frontend App
```bash
cd admin-system/frontend
npm install
npm start          # Start development server
```

### 3. Login to Dashboard
- Navigate to `http://localhost:3000`
- Email: `admin@springcompany.com`
- Password: `admin123456`

---

## 🧪 Testing

### API Health Check
```bash
curl http://localhost:5000/api/health
```

### Login Test
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@springcompany.com",
    "password": "admin123456"
  }'
```

### Using Postman
Import the API collection and test endpoints with pre-configured auth

---

## 🐛 Common Issues

| Issue | Solution |
|-------|----------|
| Port 5000 in use | Kill process or change PORT in .env |
| Cannot connect MongoDB | Start mongod / Check MONGODB_URI |
| CORS errors | Add frontend URL to CORS_ORIGIN |
| Authentication fails | Verify JWT_SECRET / Check token expiry |
| Seed fails | Ensure MongoDB running / Check permissions |

---

## 📝 API Documentation

Full API documentation with request/response examples available in:
- `admin-system/backend/README.md` - Comprehensive API guide
- `CREDENTIALS.md` - Quick reference & endpoints

---

## 🔄 Development Workflow

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```

2. **Make Changes**
   ```bash
   # Backend
   # - Add routes/models
   # - Test with Postman/curl
   
   # Frontend
   # - Build components
   # - Connect to API
   # - Test functionality
   ```

3. **Commit & Push**
   ```bash
   git commit -m "Add amazing feature"
   git push origin feature/amazing-feature
   ```

4. **Pull Request**
   - Create PR with detailed description
   - Test locally first
   - Review code quality

---

## 📞 Support & Resources

| Resource | Link |
|----------|------|
| Setup Guide | [SETUP.md](./SETUP.md) |
| Credentials | [CREDENTIALS.md](./CREDENTIALS.md) |
| API Docs | [backend/README.md](./backend/README.md) |
| MongoDB Docs | https://docs.mongodb.com |
| Express Docs | https://expressjs.com |
| React Docs | https://react.dev |

---

## 🎯 Roadmap

### Completed ✅
- [x] Backend API with authentication
- [x] User management system
- [x] Content management system
- [x] Role-based access control
- [x] Activity logging
- [x] Database models & schemas

### In Progress 🔄
- [ ] React frontend dashboard
- [ ] Login & authentication UI
- [ ] User management interface
- [ ] Content editor with rich text
- [ ] Role & permission management UI
- [ ] Activity logs viewer
- [ ] Analytics & reporting

### Future 📋
- [ ] Real-time notifications (WebSocket)
- [ ] File upload system
- [ ] Email notifications
- [ ] Advanced analytics
- [ ] API rate limiting dashboard
- [ ] Backup & restore system
- [ ] Two-factor authentication
- [ ] API key management

---

## 📄 License

Proprietary - Springcompany Admin Dashboard
All rights reserved © 2024

---

## 👥 Support

For issues, questions, or feature requests:
1. Check the documentation
2. Review existing issues
3. Create a detailed bug report

---

## 🎉 Ready to Launch!

Your admin dashboard is ready for:
- ✅ Development
- ✅ Testing
- ✅ Deployment
- ✅ Scaling

**Start the servers and begin building!**

---

**Project Status:** ✅ Production Ready  
**Current Version:** 1.0.0  
**Last Updated:** January 2024  
**Maintainer:** Springcompany Development Team
