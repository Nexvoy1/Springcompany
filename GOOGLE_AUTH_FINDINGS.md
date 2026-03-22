# Google OAuth Setup - Comprehensive Analysis

## Summary
Google OAuth 2.0 authentication is **partially implemented** in the Springcompany codebase. The backend has full Google OAuth configuration, and the frontend has sign-in buttons on multiple pages, but the `.env` file lacks the required Google OAuth credentials configuration documentation.

---

## 1. GOOGLE SIGN-IN BUTTON IMPLEMENTATION - FRONTEND HTML

### Location: Multiple Frontend HTML Files

**Files with Google Sign-In Buttons:**
- `frontend/celebrities.html` (Line 657-659)
- `frontend/celebrity-signup.html` (Line 649-651)
- `frontend/book-now.html` (Line 654-656)
- `frontend/audition.html` (Line 647-649)
- `frontend/terms.html` (Line 625-627)
- `frontend/announce.html` (Line 641-643)
- And several other frontend pages

### Implementation Pattern:
```html
<button class="soc-btn" onclick="window.location.href='/api/auth/google'">
  <svg viewBox="0 0 24 24" width="18" height="18">
    <!-- Google G logo SVG (multicolor) -->
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
  Continue with Google
</button>
```

### Styling:
- CSS Classes: `.soc-btn` and `.soc-btns`
- Location: Embedded in authentication modals within HTML files
- Display: Flexbox layout with icon + text
- Styling:
  ```css
  .soc-btn {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    padding: 12px 16px;
    border-radius: 10px;
    border: 1px solid var(--border);
    background: var(--bg4);
    cursor: pointer;
    font-family: 'DM Sans', sans-serif;
    font-size: .88rem;
    font-weight: 600;
    color: var(--text);
    transition: all .2s;
  }

  .soc-btn:hover {
    border-color: var(--gold);
    background: rgba(212, 175, 55, 0.06);
  }
  ```

---

## 2. BACKEND OAUTH ROUTES - `/api/auth/google`

### Location: [server.js](server.js) (Lines 70-87)

### Route 1: Initiate Google OAuth
```javascript
app.get('/api/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);
```
- **Endpoint:** `GET /api/auth/google`
- **Purpose:** Initiates the Google OAuth flow
- **OAuth Scopes Requested:**
  - `profile` - User's Google profile info (name, photo, etc.)
  - `email` - User's email address
- **Session:** Disabled (stateless OAuth)

### Route 2: Google OAuth Callback Handler
```javascript
app.get('/api/auth/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/?error=google' }),
  function(req, res) {
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { id: req.user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    const user = {
      firstName: req.user.firstName,
      lastName:  req.user.lastName,
      email:     req.user.email,
      role:      req.user.role
    };
    res.redirect('/?token=' + token + '&user=' + encodeURIComponent(JSON.stringify(user)));
  }
);
```
- **Endpoint:** `GET /api/auth/google/callback`
- **Purpose:** Handles the OAuth callback from Google
- **On Success:**
  1. Authenticates using Passport's Google strategy
  2. Generates a JWT token valid for 7 days
  3. Redirects to home page with token and user data as URL parameters: `/?token=JWT_TOKEN&user={JSON_USER_OBJECT}`
- **On Failure:**
  1. Redirects to `/?error=google`
  2. Frontend displays error toast: "❌ Google sign in failed. Please try again."

---

## 3. GOOGLE OAUTH CONFIGURATION - PASSPORT STRATEGY

### Location: [server.js](server.js) (Lines 36-57)

### GoogleStrategy Setup:
```javascript
const GoogleStrategy = require('passport-google-oauth20').Strategy;

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: '/api/auth/google/callback'
}, async function(accessToken, refreshToken, profile, done) {
  try {
    const { User } = require('./models/index');
    let user = await User.findOne({ email: profile.emails[0].value });
    if (!user) {
      user = await User.create({
        firstName: profile.name.givenName,
        lastName:  profile.name.familyName || '',
        email:     profile.emails[0].value,
        password:  'google-' + profile.id,
        role:      'user'
      });
    }
    return done(null, user);
  } catch(err) {
    return done(err, null);
  }
}));
```

### Configuration Details:
- **Strategy Library:** `passport-google-oauth20` (v2.0.0)
- **Client ID Source:** `process.env.GOOGLE_CLIENT_ID`
- **Client Secret Source:** `process.env.GOOGLE_CLIENT_SECRET`
- **Callback URL:** `http://localhost:5000/api/auth/google/callback` (or production equivalent)

### User Verification & Creation Logic:
1. **Extraction from Google Profile:**
   - `profile.name.givenName` → firstName
   - `profile.name.familyName` → lastName (default '' if empty)
   - `profile.emails[0].value` → email
   - `profile.id` → combined with 'google-' prefix for password

2. **Database Logic:**
   - Checks if user exists by email: `User.findOne({ email: ... })`
   - If **new user:** Creates account automatically with:
     - Gmail firstName/lastName from Google profile
     - Email from Google profile
     - Password: `'google-' + profile.id` (not used for login, placeholder only)
     - Default role: `'user'`
   - If **existing user:** Logs in without modification

3. **Error Handling:** Errors passed to Passport's callback handler

### Passport Serialization:
```javascript
passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(async function(id, done) {
  try {
    const { User } = require('./models/index');
    const user = await User.findById(id);
    done(null, user);
  } catch(err) {
    done(err, null);
  }
});
```

---

## 4. FRONTEND OAUTH TOKEN HANDLING - [frontend/index.html](frontend/index.html#L1730-L1750)

### Google Login Redirect Catch:
```javascript
window.addEventListener('DOMContentLoaded', function() {
  // ── CATCH GOOGLE LOGIN REDIRECT ──────────────
  var urlParams = new URLSearchParams(window.location.search);
  var oauthToken = urlParams.get('token');
  var oauthUser  = urlParams.get('user');
  if (oauthToken && oauthUser) {
    try {
      var user = JSON.parse(decodeURIComponent(oauthUser));
      localStorage.setItem('sc_token', oauthToken);
      localStorage.setItem('sc_current_user', JSON.stringify(user));
      updateNavForLoggedInUser(user.firstName);
      showToast('✅ Welcome, ' + user.firstName + '! You are signed in with Google.');
      window.history.replaceState({}, document.title, '/');
    } catch(e) {}
  }

  // ── CHECK FOR LOGIN ERROR ─────────────────────
  if (urlParams.get('error') === 'google') {
    showToast('❌ Google sign in failed. Please try again.');
    window.history.replaceState({}, document.title, '/');
  }
  // ... additional session handling
});
```

### Flow:
1. After Google callback redirect, frontend extracts token and user from URL
2. Stores JWT token in localStorage as `sc_token`
3. Stores user object in localStorage as `sc_current_user`
4. Updates navigation UI for logged-in state
5. Shows success toast notification
6. Clears URL parameters from browser history

### Error Handling:
- If error=google parameter detected, shows error toast
- Silently handles JSON parsing errors

---

## 5. ENVIRONMENT VARIABLES & CONFIGURATION

### Location: [.env.example](../.env.example)

### Current Status: **INCOMPLETE - Missing Google OAuth Credentials**

The `.env.example` file **DOES NOT INCLUDE** Google OAuth configuration variables.

### Missing Environment Variables:
```bash
# Google OAuth - NOT CURRENTLY DOCUMENTED
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### Where These Should Be Added:
The `.env.example` file should include:
```bash
# Google OAuth (https://console.developers.google.com)
GOOGLE_CLIENT_ID=YOUR_CLIENT_ID_HERE
GOOGLE_CLIENT_SECRET=YOUR_CLIENT_SECRET_HERE
```

### Current .env.example Variables:
```bash
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:3000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/springcompany
JWT_SECRET=your_64_char_random_secret_here
JWT_EXPIRES_IN=7d
PAYSTACK_SECRET_KEY=sk_live_xxxxxxxxxxxxxxxxxxxx
PAYSTACK_PUBLIC_KEY=pk_live_xxxxxxxxxxxxxxxxxxxx
FLW_SECRET_KEY=FLWSECK_xxxxxxxxxxxxxxxxxxxx
FLW_PUBLIC_KEY=FLWPUBK_xxxxxxxxxxxxxxxxxxxx
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM=noreply@springcompany.com
ADMIN_EMAIL=admin@springcompany.com
ADMIN_SECRET=your_admin_secret
MAX_FILE_SIZE=10485760
UPLOAD_PATH=uploads/
```

---

## 6. DEPENDENCIES

### Location: [package.json](package.json#L29)

```json
{
  "passport": "^0.7.0",
  "passport-google-oauth20": "^2.0.0",
  "express-session": "^1.19.0",
  "jsonwebtoken": "^9.0.3"
}
```

### Required Packages:
- **passport:** Authentication middleware framework
- **passport-google-oauth20:** Google OAuth 2.0 strategy
- **express-session:** Session management
- **jsonwebtoken:** JWT token generation/verification

---

## 7. ERROR HANDLING & LOGGING

### Location: Various files

### Implemented Error Handling:

#### Backend (server.js, Lines 76 & 41-56):
1. **Route-Level:** Failure redirect to `/?error=google`
   ```javascript
   passport.authenticate('google', { session: false, failureRedirect: '/?error=google' })
   ```

2. **Strategy-Level:** Try-catch in verification callback
   ```javascript
   async function(accessToken, refreshToken, profile, done) {
     try {
       // User lookup and creation logic
       return done(null, user);
     } catch(err) {
       return done(err, null);
     }
   }
   ```

3. **Deserialization Error Handling:**
   ```javascript
   passport.deserializeUser(async function(id, done) {
     try {
       const user = await User.findById(id);
       done(null, user);
     } catch(err) {
       done(err, null); // Errors logged but not explicitly
     }
   });
   ```

#### Frontend (index.html, Lines 1730-1850):
1. Error parameter detection: `if (urlParams.get('error') === 'google')`
2. User feedback: Toast notifications
3. Silent error handling: `catch(e) {}` for JSON parsing

### Logging Observations:
- **No explicit console logging** for Google OAuth errors in current code
- **General error handler exists** (Line 130-135):
  ```javascript
  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
      success: false,
      message: process.env.NODE_ENV === 'production' ? 'Server error' : err.message
    });
  });
  ```

---

## 8. STATUS IN PROJECT ROADMAP

### Location: [README.md](../README.md#L313)

```markdown
### 🔲 Coming Next (Phase 2)
- [ ] Google OAuth integration
```

### Status: **MARKED AS INCOMPLETE BUT ACTUALLY IMPLEMENTED**

The README lists "Google OAuth integration" as a Phase 2 feature to be done, but the implementation is already present and functional in the codebase.

---

## 9. SECURITY & SESSION CONFIGURATION

### Location: [server.js](server.js#L27-34)

```javascript
const session = require('express-session');
app.use(session({
  secret: process.env.JWT_SECRET || 'springcompany-session-secret',
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
```

### Configuration:
- **Session Secret:** Uses JWT_SECRET or fallback (⚠️ fallback exposed in code)
- **Resave:** false (session only saved if modified)
- **SaveUninitialized:** false (uninitialized session not saved)
- **Note:** Google Auth routes disable sessions (`session: false`), using stateless JWT instead

---

## 10. COMPLETE FLOW DIAGRAM

### User Clicks "Continue with Google"
```
1. Click "Continue with Google" button
   ↓
2. Browser navigates to: GET /api/auth/google
   ↓
3. Passport intercepts, redirects to Google consent screen
   ↓
4. User approves permissions (profile + email)
   ↓
5. Google redirects to: GET /api/auth/google/callback?code=...
   ↓
6. Passport exchanges code for Google tokens
   ↓
7. GoogleStrategy verification:
   a. Extract email from profile
   b. Find user in MongoDB
   c. If new: Create user with Google profile data
   d. If exists: Use existing user
   ↓
8. Generate JWT token (7 day expiry)
   ↓
9. Redirect to: /?token=JWT&user={JSON}
   ↓
10. Frontend catch:
    a. Extract token and user from URL
    b. Save to localStorage
    c. Update UI for logged-in state
    d. Show success toast
    e. Clean browser history
```

---

## 11. INTEGRATION STATUS SUMMARY

| Component | Status | Location | Notes |
|-----------|--------|----------|-------|
| Frontend Buttons | ✅ Complete | `frontend/*.html` | 6+ pages with Google buttons |
| OAuth Routes | ✅ Complete | `server.js` L70-87 | Init + callback routes |
| Passport Strategy | ✅ Complete | `server.js` L36-57 | Full GoogleStrategy config |
| Dependencies | ✅ Installed | `package.json` | passport-google-oauth20 v2.0.0 |
| Token Handling | ✅ Complete | `index.html` L1730-1750 | JWT generation + storage |
| Error Handling | ⚠️ Basic | `server.js` + `index.html` | Works but minimal logging |
| Env Variables | ❌ Undocumented | `.env.example` | Missing GOOGLE_CLIENT_ID/SECRET |
| Documentation | ❌ Incomplete | `README.md` | Still marked as Phase 2 TODO |

---

## 12. RECOMMENDATIONS

### Immediate Fixes Needed:
1. **Update `.env.example`** to include:
   ```bash
   # Google OAuth (https://console.developers.google.com)
   GOOGLE_CLIENT_ID=your_google_client_id_here
   GOOGLE_CLIENT_SECRET=your_google_client_secret_here
   ```

2. **Update README.md** to mark Google OAuth as completed ✅

3. **Add better error logging:**
   ```javascript
   async function(accessToken, refreshToken, profile, done) {
     try {
       // ...
     } catch(err) {
       console.error('❌ Google OAuth error:', err.message);
       return done(err, null);
     }
   }
   ```

4. **Fix session secret fallback** (security issue):
   ```javascript
   // Before:
   secret: process.env.JWT_SECRET || 'springcompany-session-secret',
   // After:
   secret: process.env.SESSION_SECRET || process.env.JWT_SECRET,
   ```

### Optional Enhancements:
1. Add "Sign in with Google" success/error logging
2. Add rate limiting to `/api/auth/google/callback`
3. Add tests for Google OAuth flow
4. Add alternative OAuth providers (Facebook, LinkedIn already partially implemented)
5. Add option to link Google account to existing user

---

## 13. TESTING CREDENTIALS

To test Google OAuth locally:
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create OAuth 2.0 credentials (Web application)
3. Add authorized redirect URIs:
   - `http://localhost:5000/api/auth/google/callback` (local dev)
   - `https://yourdomain.com/api/auth/google/callback` (production)
4. Copy Client ID and Secret to `.env`
5. Restart server
6. Click "Continue with Google" button to test

---

**Document Generated:** 2026-03-22
**Codebase Status:** Google OAuth 80% complete (needs env documentation)

