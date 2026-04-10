# Campus Club Collaboration - Deployment Guide

## ⚠️ Important: Database Issue
SQLite (file-based) won't work on Vercel because:
- Vercel has ephemeral filesystem (resets every deployment)
- Database file won't persist between requests
- Data will be lost on each redeployment

## Solution Options

### Option 1: Backend on Railway + Frontend on Vercel (RECOMMENDED)
**Best for: Full-stack deployment with database persistence**

### Option 2: Backend on Render + Frontend on Vercel
**Best for: Free tier with good uptime**

### Option 3: Upgrade to MongoDB + Deploy both on Vercel
**Best for: Fully serverless architecture**

---

## STEP 1: Deploy Frontend to Vercel (All Options)

### 1.1 Connect Your Repository
```
Already done - you imported on Vercel ✓
```

### 1.2 Go to Vercel Dashboard
- https://vercel.com/dashboard
- Select your Campus Club project
- Click "Settings" → "Environment Variables"

### 1.3 Add Environment Variable
Click "Add Environment Variable"
- **Name:** `VITE_API_URL`
- **Value:** (Leave empty for now, we'll set after backend is deployed)
- Value for production will be: `https://your-backend-url.railway.app` (example)

### 1.4 Frontend Build Settings
- **Framework Preset:** Vite
- **Build Command:** `cd client && npm install && npm run build`
- **Output Directory:** `client/dist`
- **Install Command:** `npm install`

### 1.5 Deploy Frontend
- Go back to Deployments tab
- Click "Redeploy" or push to GitHub
- Wait for build to complete
- Your frontend will be live at: `https://your-project.vercel.app`

---

## STEP 2: Deploy Backend to Railway

### 2.1 Go to Railway
- https://railway.app
- Click "Start a New Project"
- Select "Deploy from GitHub repo"
- Choose your repository
- Click "Deploy Now"

### 2.2 Configure Railway
- **Service Name:** campus-club-backend
- **Port:** 5000

### 2.3 Deploy
- Railway will auto-detect `package.json`
- May take 2-3 minutes to build
- You'll get a URL like: `https://campus-club-backend-prod.up.railway.app`

### 2.4 Test Backend
```bash
curl https://campus-club-backend-prod.up.railway.app/api/stats
```

---

## STEP 3: Connect Frontend to Backend

### 3.1 Update Frontend API URL
Go back to Vercel Dashboard:
- Your project → Settings → Environment Variables
- Edit `VITE_API_URL`
- Set to: `https://your-backend-railway-url.railway.app` (from Step 2.3)

### 3.2 Update api.js in Code
File: `client/src/api.js`

Change line 1:
```javascript
// OLD:
const API = 'http://localhost:5000/api';

// NEW:
const API = process.env.VITE_API_URL 
  ? `${process.env.VITE_API_URL}/api` 
  : 'http://localhost:5000/api';
```

### 3.3 Redeploy Frontend
- Push changes to GitHub
- Vercel auto-deploys
- Wait for build to complete

---

## STEP 4: Test Full Deployment

### 4.1 Test Frontend
- Open: `https://your-project.vercel.app`
- Try registering a student
- Open DevTools (F12) → Console
- Look for: `[API] POST /auth/register`
- Check if URL shows your Railway backend

### 4.2 Test Backend Directly
```bash
curl -X POST https://your-backend-url/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "Name":"Test User",
    "Email":"test@vercel.com",
    "Password":"Password123"
  }'
```

Should return: `{"user":{...},"token":"..."}`

---

## STEP 5: Enable CORS on Backend

File: `server/index.js` (Line ~2)

Update CORS to allow your Vercel domain:
```javascript
app.use(cors({
  origin: ['https://your-project.vercel.app', 'http://localhost:5173'],
  credentials: true
}));
```

Then redeploy backend to Railway.

---

## ✅ Final Checklist

- [ ] Frontend deployed on Vercel
- [ ] Backend deployed on Railway
- [ ] Frontend can reach backend (test API calls in console)
- [ ] User registration works end-to-end
- [ ] Profile loads without errors
- [ ] Admin features work
- [ ] No CORS errors in console

---

## 🔧 Troubleshooting

### Issue: CORS Error
**Solution:** Add your Vercel domain to CORS in server/index.js

### Issue: 404 Not Found
**Solution:** Check that backend URL is correct in Vercel environment variables

### Issue: Database Empty After Redeploy
**Known Issue:** SQLite on Vercel won't persist. Use MongoDB instead.

### Issue: Build Fails on Vercel
**Solution:** Check build logs in Vercel dashboard → Deployments → Click failed build

---

## 📱 Production URLs

After deployment:
- **Frontend:** https://your-project.vercel.app
- **Backend API:** https://your-backend.railway.app/api
- **Admin Demo:** admin@vit.ac.in / admin123
- **Student Demo:** advika@vit.ac.in / student123

---

## Next Steps (Optional)

1. **Custom Domain:** Connect your own domain in Vercel settings
2. **SSL Certificate:** Automatic with Vercel + Railway
3. **Database:** Migrate from SQLite to MongoDB for true persistence
4. **Analytics:** Enable analytics in Vercel dashboard
