# Google OAuth Setup Guide

## Problem Fixed ✅
- Added missing `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` environment variables to `.env`
- Updated callback URL to dynamically use your production domain

## What You Need to Do

### Step 1: Get Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one called **"springcompany"**
3. Enable **Google+ API**:
   - Go to "APIs & Services" → "Library"
   - Search for "Google+ API"
   - Click "Enable"
4. Create OAuth 2.0 Credentials:
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth client ID"
   - Choose "Web application"
   - Set the following **Authorized JavaScript origins**:
     ```
     http://localhost:5000
     https://springcompany.vercel.app
     ```
   - Set the following **Authorized redirect URIs**:
     ```
     http://localhost:5000/api/auth/google/callback
     https://springcompany.vercel.app/api/auth/google/callback
     ```
   - Click "Create"
5. Copy your **Client ID** and **Client Secret**

### Step 2: Update .env File

Open `.env` and replace the placeholder values:

```env
GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID_HERE
GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET_HERE
```

Example (with fake credentials):
```env
GOOGLE_CLIENT_ID=123456789-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-ABCDEFGHIJKLMNOPQRSTUVwxyz
```

### Step 3: Restart Your Server

```bash
npm start
```

### Step 4: Test Google Sign-In

1. Go to your site: https://springcompany.vercel.app
2. Click "Continue with Google" button
3. You should be redirected to Google login
4. After login, you'll be redirected back with your user data

## Troubleshooting

### Error: "redirect_uri_mismatch"
- **Solution:** Make sure the redirect URI in Google Cloud Console matches exactly:
  - For production: `https://springcompany.vercel.app/api/auth/google/callback`
  - For local: `http://localhost:5000/api/auth/google/callback`

### Error: "Client ID not found" or similar
- **Solution:** Check that `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set in `.env`
- Restart the server after updating `.env`

### Error: "Invalid origin for CORS"
- **Solution:** Ensure `CLIENT_URL` is correct in `.env` for your environment

## Files Modified

✅ `.env` - Added Google OAuth credentials placeholders
✅ `server.js` - Updated callback URL to be dynamic based on environment

## Testing Locally

For local development, use:
```env
GOOGLE_CLIENT_ID=your_localhost_client_id
GOOGLE_CLIENT_SECRET=your_localhost_client_secret
```

And register this redirect URI in Google Cloud Console:
```
http://localhost:5000/api/auth/google/callback
```

---

Need help? Check [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
