# GitHub Push Guide

## Step 1: Configure Git (अगर पहले से configure नहीं है)

### Option A: Global Configuration (सभी projects के लिए)
```powershell
git config --global user.name "Your GitHub Username"
git config --global user.email "your-email@example.com"
```

### Option B: इस Project के लिए ही (Local)
```powershell
git config user.name "Your GitHub Username"
git config user.email "your-email@example.com"
```

## Step 2: GitHub पर New Repository बनाएं

1. GitHub.com पर login करें
2. Click on **"+"** (top right) → **"New repository"**
3. Repository name: `pegasus` (या जो चाहें)
4. **Public** या **Private** select करें
5. **"Initialize this repository with a README"** को UNCHECK करें (हमारे पास already files हैं)
6. Click **"Create repository"**

## Step 3: Commit और Push करें

### पहले commit करें (Git config set करने के बाद):
```powershell
cd "C:\Users\anmol\OneDrive\Desktop\pegasus"
git commit -m "Initial commit: Ready for Vercel deployment"
```

### GitHub repository को remote के रूप में add करें:
```powershell
git remote add origin https://github.com/YOUR_USERNAME/pegasus.git
```
(Replace `YOUR_USERNAME` with your actual GitHub username)

### Push करें:
```powershell
git branch -M main
git push -u origin main
```

## Step 4: Vercel में Deploy करें

1. Vercel.com पर login करें
2. **"New Project"** click करें
3. GitHub से repository import करें
4. **Root Directory**: `frontend` select करें (या `vercel.json` automatically handle करेगा)
5. **Environment Variables** add करें:
   - `NEXT_PUBLIC_API_URL` = आपकी backend API URL
6. **Deploy** click करें

---

**Note**: अगर आपको GitHub authentication के लिए token की जरूरत है, GitHub Settings → Developer settings → Personal access tokens से token बना सकते हैं.
