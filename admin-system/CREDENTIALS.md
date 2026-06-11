# Admin Dashboard - Credentials & Quick Reference

## 🔑 Default Admin Credentials

**After running `npm run seed`:**

| Field | Value |
|-------|-------|
| Email | `admin@springcompany.com` |
| Password | `admin123456` |
| Role | Super Admin |
| Access | Full system access |

⚠️ **IMPORTANT:** Change password immediately after first login in production!

---

## 🔗 API Endpoints Quick Reference

### Authentication
| Method | Endpoint | Auth Required |
|--------|----------|---------------|
| POST | `/api/auth/register` | ❌ No |
| POST | `/api/auth/login` | ❌ No |
| POST | `/api/auth/refresh-token` | ❌ No |
| POST | `/api/auth/logout` | ✅ Yes |
| POST | `/api/auth/change-password` | ✅ Yes |
| POST | `/api/auth/forgot-password` | ❌ No |

### User Management
| Method | Endpoint | Auth Required | Role Required |
|--------|----------|---------------|---------------|
| GET | `/api/users` | ✅ Yes | Admin+ |
| GET | `/api/users/:id` | ✅ Yes | Owner or Admin |
| PUT | `/api/users/:id` | ✅ Yes | Owner or Admin |
| PUT | `/api/users/:id/role` | ✅ Yes | Super Admin |
| PUT | `/api/users/:id/toggle-active` | ✅ Yes | Super Admin |
| DELETE | `/api/users/:id` | ✅ Yes | Super Admin |
| GET | `/api/users/:id/activity` | ✅ Yes | Owner or Admin |

### Content Management
| Method | Endpoint | Auth Required |
|--------|----------|---------------|
| GET | `/api/content` | ❌ No (published only) |
| GET | `/api/content/:id` | ❌ No (published only) |
| POST | `/api/content` | ✅ Yes (Manager+) |
| PUT | `/api/content/:id` | ✅ Yes (Owner or Admin) |
| POST | `/api/content/:id/publish` | ✅ Yes (Owner or Admin) |
| DELETE | `/api/content/:id` | ✅ Yes (Owner or Admin) |
| POST | `/api/content/:id/like` | ❌ No |

### Role Management
| Method | Endpoint | Auth Required | Role Required |
|--------|----------|---------------|---------------|
| GET | `/api/roles` | ✅ Yes | Admin+ |
| GET | `/api/roles/:id` | ✅ Yes | Admin+ |
| POST | `/api/roles` | ✅ Yes | Super Admin |
| PUT | `/api/roles/:id` | ✅ Yes | Super Admin |
| DELETE | `/api/roles/:id` | ✅ Yes | Super Admin |

### Settings Management
| Method | Endpoint | Auth Required | Role Required |
|--------|----------|---------------|---------------|
| GET | `/api/settings` | ❌ No (public only) |
| GET | `/api/settings/:key` | ✅ Yes | Admin+ |
| POST | `/api/settings` | ✅ Yes | Super Admin |
| PUT | `/api/settings/:key` | ✅ Yes | Super Admin |
| DELETE | `/api/settings/:key` | ✅ Yes | Super Admin |

---

## 👥 Pre-configured Roles & Permissions

### 1. **Super Admin** (Level 100)
- **Full Access:** All operations on all resources
- **Special:** Can manage users, roles, settings
- **Use Case:** Platform administrators

### 2. **Admin** (Level 80)
- **Users:** Read only
- **Content:** Full CRUD + Publish
- **Logs:** Read only
- **Settings:** Read only
- **Use Case:** Administrative staff

### 3. **Content Manager** (Level 60)
- **Content:** Full CRUD + Publish
- **Users:** Read only
- **Use Case:** Team managing all content

### 4. **Editor** (Level 40)
- **Content:** Create, edit, publish own content
- **Use Case:** Content creators

### 5. **Moderator** (Level 30)
- **Content:** Read + Update
- **Use Case:** Content moderation

### 6. **Viewer** (Level 10)
- **Content:** Read only
- **Use Case:** Limited viewing access

### 7. **User** (Level 1)
- **Profile:** Read + Update own
- **Content:** Read published only
- **Use Case:** Regular platform users

---

## 📋 Content Categories

When creating/updating content, use one of these categories:

1. **News** - Current events and announcements
2. **Blog** - Blog posts and articles
3. **Page** - Static pages (About, Contact, etc.)
4. **Announcement** - System announcements
5. **Celebrity Info** - Celebrity profiles and information

---

## 🌐 URLs & Ports

| Service | URL | Default Port |
|---------|-----|--------------|
| Backend API | `http://localhost:5000` | 5000 |
| Frontend App | `http://localhost:3000` | 3000 |
| MongoDB | `mongodb://localhost:27017` | 27017 |
| API Health | `http://localhost:5000/api/health` | - |

---

## 🔄 Token Architecture

### Access Token
- **Duration:** 12 hours
- **Usage:** All protected API requests
- **Header:** `Authorization: Bearer <access_token>`
- **Refresh:** Not needed during 12-hour window

### Refresh Token
- **Duration:** 7 days
- **Usage:** Request new access token
- **Endpoint:** `POST /api/auth/refresh-token`
- **Response:** New access + refresh tokens

### Token Refresh Flow
```
1. User logs in → receives both tokens
2. After 12 hours → access token expires
3. Call refresh endpoint with refresh token
4. Receive new access token (continue working)
5. After 7 days → refresh token expires (login again)
```

---

## 🔐 Password Requirements

- **Minimum Length:** 6 characters
- **Special Characters:** Not required
- **Numbers:** Not required
- **Hashing:** bcryptjs (10 salt rounds)
- **Storage:** Never stored in plain text

---

## 🚨 Account Locking

- **Trigger:** 5 failed login attempts
- **Lock Duration:** 30 minutes
- **Reset:** Automatic after 30 min OR password change
- **Action on Lock:** Account temporarily disabled

---

## 📝 Activity Log Types

System logs these actions:

| Action | Trigger | Details |
|--------|---------|---------|
| CREATE | New resource created | Resource type + ID |
| READ | Resource viewed | Entity accessed |
| UPDATE | Resource modified | Track field changes |
| DELETE | Resource deleted | Soft or hard delete |
| LOGIN | User authentication | Successful login |
| LOGOUT | User session end | Logout event |
| DOWNLOAD | File downloaded | Download initiated |
| UPLOAD | File uploaded | Upload completed |

---

## 📊 Common API Responses

### Success Response (HTTP 200, 201)
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { "id": "...", "name": "..." }
}
```

### Error Response (HTTP 400, 401, 403, 500)
```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    { "field": "email", "msg": "Invalid email" }
  ]
}
```

### Paginated Response
```json
{
  "success": true,
  "data": [ {...}, {...} ],
  "pagination": {
    "total": 100,
    "pages": 10,
    "currentPage": 1
  }
}
```

---

## 🧪 Quick Test Commands

### Test API Health
```bash
curl http://localhost:5000/api/health
```

### Test Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@springcompany.com",
    "password": "admin123456"
  }'
```

### Test Protected Route
```bash
curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  http://localhost:5000/api/users
```

---

## 🆘 Troubleshooting Checklist

- [ ] Backend running on port 5000?
- [ ] MongoDB connected and seeded?
- [ ] `.env` file created in `backend/` directory?
- [ ] Correct credentials used for login?
- [ ] `CORS_ORIGIN` includes frontend URL?
- [ ] Front/back tokens match in headers?
- [ ] User role has required permissions?
- [ ] No typos in API endpoints?

---

## 📞 Support Resources

| Resource | Location |
|----------|----------|
| API Docs | `admin-system/backend/README.md` |
| Setup Guide | `admin-system/SETUP.md` |
| Environment Template | `admin-system/backend/.env.example` |
| Database Config | `admin-system/backend/config/database.js` |

---

**Status:** ✅ Ready for Use
**Last Updated:** January 2024
**Version:** 1.0.0
