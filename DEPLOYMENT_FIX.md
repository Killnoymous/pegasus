# Vercel Deployment Fix - 404 Error Solution

## Problem
404 error: NOT_FOUND after deployment

## Root Cause
Vercel doesn't know where your Next.js app is because the Root Directory is not set correctly.

## Solution

### Step 1: Vercel Dashboard Settings (CRITICAL)

1. Go to your Vercel project: https://vercel.com/dashboard
2. Select your **pegasus** project
3. Go to **Settings** tab
4. Click on **General** section
5. Scroll down to **Root Directory** section
6. Click **Edit**
7. Set Root Directory to: `frontend`
8. Click **Save**

### Step 2: Redeploy

After changing Root Directory:
- Go to **Deployments** tab
- Click on the three dots (⋯) on the latest deployment
- Click **Redeploy**
- Or make a small change and push to GitHub (this will trigger auto-deploy)

### Step 3: Verify Build Settings

In Vercel project **Settings** → **General**:

- **Framework Preset**: Next.js (should auto-detect)
- **Root Directory**: `frontend` (MUST be set)
- **Build Command**: Leave empty or auto (Next.js will handle)
- **Output Directory**: Leave empty or auto (Next.js will handle)
- **Install Command**: Leave empty or auto (`npm install`)

### Step 4: Environment Variables

Make sure you have set:
- `NEXT_PUBLIC_API_URL` = Your backend API URL

## Alternative: If Still Not Working

If you still get 404 after setting Root Directory:

### Option 1: Check Build Logs
1. Go to your deployment
2. Click on the deployment
3. Check the **Build Logs** tab
4. Look for any errors during build

### Option 2: Verify File Structure
Make sure your GitHub repository has this structure:
```
pegasus/
├── frontend/
│   ├── app/
│   │   ├── page.tsx
│   │   ├── layout.tsx
│   │   └── ...
│   ├── package.json
│   ├── next.config.js
│   └── ...
└── backend/
    └── ...
```

### Option 3: Manual Build Test
Test if build works locally:
```powershell
cd frontend
npm install
npm run build
```

If build succeeds locally but fails on Vercel, check build logs for specific errors.

## Important Notes

- **DO NOT** use `rootDirectory` in `vercel.json` (not allowed)
- **MUST** set Root Directory in Vercel Dashboard (Settings → General)
- Root Directory must be: `frontend` (relative to repository root)
- Vercel will auto-detect Next.js once Root Directory is correct
