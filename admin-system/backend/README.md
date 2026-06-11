# Springcompany Admin Dashboard API

A production-ready admin management system built with **Node.js**, **Express.js**, **MongoDB**, and **JWT authentication** with comprehensive Role-Based Access Control (RBAC).

---

## 📋 Features

✅ **User Management**
- User CRUD operations with soft delete
- Role-based access control (7 role levels)
- Account locking after failed login attempts
- Password hashing with bcryptjs

✅ **Authentication**
- JWT-based authentication (access + refresh tokens)
- Secure login with login attempt tracking
- Password change and forgot password endpoints
- Account locking mechanism (30 min after 5 failed attempts)

✅ **Content Management**
- Create, read, update, publish content
- Multiple content categories (News, Blog, Page, Announcement, Celebrity Info)
- Draft and publish workflow
- Auto-slug generation from title
- View and like tracking
- Rich text content support

✅ **Role-Based Access Control (RBAC)**
- 7 pre-configured roles: Super Admin, Admin, Content Manager, Editor, Moderator, Viewer, User
- Fine-grained permission control (feature-based)
- Role hierarchy system
- Per-endpoint authorization

✅ **Activity Logging**
- Automatic logging of all CRUD operations
- Track user actions, IP addresses, user agents
- 90-day auto-archival of logs
- Searchable activity history per user

✅ **Settings Management**
- Store application-wide settings
- Configuration by category (Email, Upload, Security, API, General)
- Audit tracking of setting changes

---

## 🚀 Quick Start

### 1. Installation

```bash
cd admin-system/backend
npm install
```

### 2. Environment Setup

Create a `.env` file in the backend directory:

```env
PORT=5000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/springcompany

# JWT
JWT_SECRET=your_jwt_secret_key_here
JWT_REFRESH_SECRET=your_refresh_token_secret_here

# CORS
CORS_ORIGIN=http://localhost:3000,http://localhost:3001

# Optional: Cloudinary (for file uploads)
CLOUDINARY_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Optional: Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

### 3. Database Seeding

Initialize the database with default roles and admin user:

```bash
npm run seed
```

**Default Admin Credentials:**
- Email: `admin@springcompany.com`
- Password: `admin123456` (⚠️ Change immediately in production!)

### 4. Start the Server

**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

Server will run on `http://localhost:5000`

---

## 🔐 Authentication

### Register
```bash
POST /api/auth/register
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "65d7cd5e8a1b2c3d4e5f6g7h",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "role": "65d7cd5e8a1b2c3d4e5f6g7h"
  }
}
```

### Login
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@springcompany.com",
  "password": "admin123456"
}
```

### Refresh Token
```bash
POST /api/auth/refresh-token
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Using Authorization Header
All protected endpoints require the access token:

```bash
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 👥 User Management

### Get All Users
```bash
GET /api/users?page=1&limit=10&search=john&role=65d7cd5e8a1b2c3d4e5f6g7h
Authorization: Bearer <access_token>
```

### Get User by ID
```bash
GET /api/users/65d7cd5e8a1b2c3d4e5f6g7h
Authorization: Bearer <access_token>
```

### Update User
```bash
PUT /api/users/65d7cd5e8a1b2c3d4e5f6g7h
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "firstName": "Jane",
  "lastName": "Smith",
  "phone": "+1234567890",
  "avatar": "https://..."
}
```

### Change User Role (Super Admin Only)
```bash
PUT /api/users/65d7cd5e8a1b2c3d4e5f6g7h/role
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "roleId": "65d7cd5e8a1b2c3d4e5f6g7h"
}
```

### Toggle User Active Status (Super Admin Only)
```bash
PUT /api/users/65d7cd5e8a1b2c3d4e5f6g7h/toggle-active
Authorization: Bearer <access_token>
```

### Delete User (Soft Delete)
```bash
DELETE /api/users/65d7cd5e8a1b2c3d4e5f6g7h
Authorization: Bearer <access_token>
```

---

## 📝 Content Management

### Get All Content
```bash
GET /api/content?page=1&limit=10&category=News&status=Published&search=title
```

### Get Single Content
```bash
GET /api/content/65d7cd5e8a1b2c3d4e5f6g7h
```

### Create Content
```bash
POST /api/content
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "title": "Breaking News",
  "category": "News",
  "content": "<h1>News Content</h1><p>Details here...</p>",
  "tags": "news,breaking,urgent",
  "status": "Draft"
}
```

### Update Content
```bash
PUT /api/content/65d7cd5e8a1b2c3d4e5f6g7h
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "title": "Updated Title",
  "status": "Published"
}
```

### Publish Content
```bash
POST /api/content/65d7cd5e8a1b2c3d4e5f6g7h/publish
Authorization: Bearer <access_token>
```

### Delete Content
```bash
DELETE /api/content/65d7cd5e8a1b2c3d4e5f6g7h
Authorization: Bearer <access_token>
```

### Like Content
```bash
POST /api/content/65d7cd5e8a1b2c3d4e5f6g7h/like
Authorization: Bearer <access_token> (optional)
```

---

## 🔑 Role Management

### Get All Roles
```bash
GET /api/roles
Authorization: Bearer <access_token>
```

### Create New Role (Super Admin Only)
```bash
POST /api/roles
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "name": "Content Reviewer",
  "description": "Review and approve content",
  "permissions": [
    {
      "feature": "Content",
      "actions": ["READ", "UPDATE"]
    },
    {
      "feature": "Users",
      "actions": ["READ"]
    }
  ]
}
```

### Update Role
```bash
PUT /api/roles/65d7cd5e8a1b2c3d4e5f6g7h
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "permissions": [
    {
      "feature": "Content",
      "actions": ["CREATE", "READ", "UPDATE", "DELETE", "PUBLISH"]
    }
  ]
}
```

### Delete Role (Super Admin Only)
```bash
DELETE /api/roles/65d7cd5e8a1b2c3d4e5f6g7h
Authorization: Bearer <access_token>
```

---

## ⚙️ Settings Management

### Get All Settings
```bash
GET /api/settings
Authorization: Bearer <access_token>
```

### Get Setting by Key
```bash
GET /api/settings/mail_notification_enabled
Authorization: Bearer <access_token>
```

### Create Setting (Super Admin Only)
```bash
POST /api/settings
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "key": "max_upload_size",
  "value": "52428800",
  "type": "Number",
  "category": "Upload",
  "description": "Maximum file upload size in bytes"
}
```

### Update Setting
```bash
PUT /api/settings/max_upload_size
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "value": "104857600"
}
```

### Delete Setting
```bash
DELETE /api/settings/max_upload_size
Authorization: Bearer <access_token>
```

---

## 📊 Activity Logging

### Get User Activity
```bash
GET /api/users/65d7cd5e8a1b2c3d4e5f6g7h/activity?page=1&limit=20
Authorization: Bearer <access_token>
```

**Activity Types:** CREATE, READ, UPDATE, DELETE, LOGIN, LOGOUT, DOWNLOAD, UPLOAD

---

## 🗂️ Project Structure

```
admin-system/
├── backend/
│   ├── models/
│   │   ├── User.js           # User schema with auth methods
│   │   ├── Role.js           # Role schema with permissions
│   │   ├── Content.js        # Content schema with CMS features
│   │   ├── ActivityLog.js    # Activity logging schema
│   │   └── Setting.js        # Settings schema
│   ├── routes/
│   │   ├── auth.js           # Authentication endpoints
│   │   ├── users.js          # User management endpoints
│   │   ├── content.js        # Content management endpoints
│   │   ├── roles.js          # Role management endpoints
│   │   └── settings.js       # Settings management endpoints
│   ├── middleware/
│   │   ├── auth.js           # JWT verification & RBAC
│   │   └── errorHandler.js   # Global error handling
│   ├── config/
│   │   └── database.js       # MongoDB connection
│   ├── server.js             # Express app entry point
│   └── package.json
├── frontend/                  # React frontend (next phase)
├── seed.js                    # Database initialization
└── README.md
```

---

## 🔐 Role Hierarchy

| Role | Level | Capabilities |
|------|-------|--------------|
| **Super Admin** | 100 | Full system access, manage users/roles/settings |
| **Admin** | 80 | Manage content, view users, read logs |
| **Content Manager** | 60 | Create/edit/publish all content |
| **Editor** | 40 | Create/edit/publish own content |
| **Moderator** | 30 | Moderate user content (update) |
| **Viewer** | 10 | Read-only access to content |
| **User** | 1 | Basic user profile access |

---

## 🛡️ Security Features

- **Password Hashing:** bcryptjs with salt rounds (10)
- **JWT Tokens:** Access (12h) + Refresh (7d) tokens
- **Account Locking:** Auto-lock after 5 failed login attempts
- **CORS Protection:** Configurable origin whitelist
- **Request Validation:** express-validator for all inputs
- **Rate Limiting:** Per-user request limiting
- **Soft Deletes:** Users marked as deleted, not actually removed
- **Activity Audit Trail:** All actions logged with timestamps/IP

---

## 📦 Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| express | ^4.18.2 | Web framework |
| mongoose | ^7.5.0 | MongoDB ODM |
| bcryptjs | ^2.4.3 | Password hashing |
| jsonwebtoken | ^9.1.0 | JWT auth |
| dotenv | ^16.3.1 | Environment variables |
| cors | ^2.8.5 | CORS middleware |
| morgan | ^1.10.0 | HTTP logging |
| express-validator | ^7.0.0 | Request validation |

---

## 🚀 Deployment

### Environment Variables for Production

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/springcompany
JWT_SECRET=<use strong secret>
JWT_REFRESH_SECRET=<use strong secret>
CORS_ORIGIN=https://yourdomain.com
```

### Deployment Platforms

- **Heroku:** `git push heroku main`
- **Vercel:** Use with serverless functions
- **Render:** Connect GitHub repository
- **AWS EC2:** Deploy Node.js application
- **DigitalOcean:** App Platform or Droplets

---

## 🧪 Testing

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

---

## 📝 API Documentation

**Full Postman Collection:** [Download collection file]

---

## 🐛 Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running: `mongod`
- Check `MONGODB_URI` in `.env`
- Verify network access (MongoDB Atlas)

### Authentication Fails
- Verify JWT_SECRET is set in `.env`
- Check token expiration (access: 12h, refresh: 7d)
- Ensure header format: `Authorization: Bearer <token>`

### Permission Denied
- Verify user role has required permissions
- Check role permissions for the feature/action
- Super Admin bypasses all permission checks

---

## 📞 Support

For issues or questions, please:
1. Check the troubleshooting section
2. Review API documentation
3. Check server logs for errors

---

## 📄 License

Proprietary - Springcompany Admin Dashboard

---

## 👥 Contributing

1. Create feature branch: `git checkout -b feature/amazing-feature`
2. Commit changes: `git commit -m 'Add amazing feature'`
3. Push branch: `git push origin feature/amazing-feature`
4. Open Pull Request

---

**Last Updated:** January 2024
**Version:** 1.0.0
**Status:** Production Ready ✅
