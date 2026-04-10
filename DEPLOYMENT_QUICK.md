# 🚀 Quick Deployment Checklist

## Before You Deploy - Local Testing
- [ ] Test registration: `http://localhost:5173`
- [ ] Test profile loading
- [ ] Check console (F12) has no errors
- [ ] Test admin features
- [ ] All existing features still work

## Step 1: Prepare GitHub (5 minutes)
```bash
cd C:\Users\ANUBHAV\ UTKARSH\Downloads\CampusClubColaboration

# Ensure latest changes are committed
git add .
git commit -m "Add student registration feature with profile management"
git push origin main
```

## Step 2: Setup Backend on Railway (10 minutes)
1. Go to https://railway.app
2. New Project → Deploy from GitHub
3. Select your repository
4. Click "Deploy Now"
5. Wait for build (2-3 minutes)
6. Copy your Railway URL from deployment panel
   - Format: `https://xxx-prod.up.railway.app`

## Step 3: Configure Vercel Frontend (5 minutes)
1. Go to https://vercel.com/dashboard
2. Select your project
3. Settings → Environment Variables
4. Add new variable:
   - Name: `VITE_API_URL`
   - Value: `https://[your-railway-url]` (from Step 2)
5. Save

## Step 4: Redeploy Frontend (5 minutes)
1. Go to Deployments tab
2. Click "Redeploy"
3. Select "Redeploy existing builds"
4. Wait for build complete

## Step 5: Test Production (5 minutes)
1. Go to `https://[your-vercel-url]`
2. Register a new account
3. Open DevTools (F12) → Console
4. Should see: `[API] POST /auth/register`
5. Check URL includes your Railway domain
6. Go to "My Profile" and verify it loads

## Troubleshooting

### Frontend shows blank page
- Clear cache: Ctrl+Shift+R
- Check Vercel build logs
- Restart browser

### API calls fail (CORS error)
- Check `VITE_API_URL` is set correctly
- Verify backend is running on Railway
- Check server CORS configuration

### Profile doesn't load
- Check `VITE_API_URL` environment variable
- Open DevTools → Network tab
- See if API request to backend succeeds
- Check console for errors

### 404 Not Found on API
- Verify Railway URL is correct (no trailing slash)
- Test backend directly: `curl https://[railway-url]/api/stats`
- Check server is running on Railway dashboard

## Demo Credentials
```
Admin:
  Email: admin@vit.ac.in
  Password: admin123

Student:
  Email: advika@vit.ac.in
  Password: student123
```

Or register a new student and test!

## Success Indicators ✅
- [x] Frontend loads without errors
- [x] Can register new student
- [x] Profile page shows user info
- [x] Can edit profile
- [x] Can add/remove phone numbers
- [x] Admin can view all registrations
- [x] All existing features work (clubs, events, etc.)
- [x] No CORS errors in console

## Final URLs
- **Frontend:** https://[your-vercel-url]
- **Backend API:** https://[your-railway-url]/api

---

**Estimated Total Time: 30 minutes**

Questions? Check DEPLOYMENT.md for detailed instructions!
