# ⚡ FREE DEPLOYMENT - 10 MINUTE CHECKLIST

## 🔗 Quick Links
- Render.com sign up: https://render.com
- Vercel dashboard: https://vercel.com/dashboard  
- Your Vercel project: [Add your URL]

---

## ✅ CHECKLIST (10 minutes)

### ☐ STEP 1: Push to GitHub (2 min)
```bash
git add .
git commit -m "Deploy free: Render backend + Vercel frontend"
git push origin main
```

### ☐ STEP 2: Create Render Account (1 min)
- Go to https://render.com
- Click "Sign up with GitHub"
- Authorize & connect

### ☐ STEP 3: Deploy Backend (5 min)
Dashboard → "New +" → "Web Service"
- Select: **CampusClubColaboration** repo
- Name: `campus-club-backend`
- Environment: `Node`
- Build: `cd server && npm install`
- Start: `cd server && npm start`
- Plan: **Free**
- Click "Create Web Service"
- **WAIT** for deploy (2-3 min)
- **COPY** your URL: `https://campus-club-backend-xxxxx.onrender.com`

### ☐ STEP 4: Set Vercel Env Var (2 min)
1. Go to https://vercel.com/dashboard
2. Select your project
3. Settings → Environment Variables
4. Add:
   - Name: `VITE_API_URL`
   - Value: `https://campus-club-backend-xxxxx.onrender.com` (from Step 3)
5. Save

### ☐ STEP 5: Redeploy Frontend (1 min)
1. Vercel → Deployments
2. Click latest deployment → `...` menu
3. "Redeploy"
4. Confirm
5. **WAIT** for redeploy (1-2 min)

---

## 🧪 TEST IT! (1 min)

### Test 1: Open App
- [ ] Click Vercel URL: `https://your-app.vercel.app`
- [ ] UI loads ✅

### Test 2: Register
- [ ] Click "Register" 
- [ ] Fill: Name, Email, Password, Dept, Semester
- [ ] Click "Create Account"
- [ ] See success ✅

### Test 3: Profile
- [ ] Click "👤 My Profile"
- [ ] See your info ✅
- [ ] Can edit & add phone ✅

### Test 4: No Errors
- [ ] F12 → Console
- [ ] No red errors ✅

---

## 🎉 DONE!

**FREE DEPLOYMENT IN 10 MINUTES**

Your app is now live at: `https://your-app.vercel.app` 🚀

---

## ❓ FAQ

**Q: Will it go down?**
A: No. Free tier is stable. May sleep after 15min inactivity but data persists.

**Q: Why does first load take long?**
A: Free backend wakes up (cold start). Normal & expected.

**Q: What about database?**
A: SQLite persists on Render. Data is safe.

**Q: Can I upgrade later?**
A: Yes! Render paid = $7-10/mo for always-on.

---

## 📞 If It Breaks

1. Check Render logs: Dashboard → Service → Logs
2. Check Vercel logs: Dashboard → Deployments → Latest
3. Check browser console: F12 → Console tab
4. Try again - first request might be slow

Done! ✨
