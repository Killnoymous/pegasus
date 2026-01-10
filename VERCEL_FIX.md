# Vercel 404 Error - Complete Fix Guide

## Problem
404: NOT_FOUND error after deployment

## Root Cause Analysis
When Root Directory is set to `frontend`, Vercel changes its working directory to `frontend/`. The Output Directory must be relative to this working directory, not the repository root.

## Solution - Vercel Dashboard Settings

### Step 1: Go to Project Settings
1. Open your Vercel project: https://vercel.com/dashboard
2. Click on your **pegasus** project
3. Go to **Settings** tab
4. Click on **General** section

### Step 2: Configure Root Directory
1. Find **Root Directory** section
2. Click **Edit**
3. Enter: `frontend` (without quotes)
4. Click **Save**

### Step 3: Configure Build Settings (CRITICAL)
In the same **General** section, scroll to **Build & Development Settings**:

1. **Framework Preset**: `Next.js` (should auto-detect, but verify)
2. **Root Directory**: `frontend` (already set above)
3. **Build Command**: Leave EMPTY or set to: `npm run build`
   - When Root Directory is `frontend`, commands run from frontend/ directory
   - So just use: `npm run build` (NOT `cd frontend && npm run build`)
4. **Output Directory**: Leave EMPTY or set to: `.next`
   - **IMPORTANT**: When Root Directory is `frontend`, output is relative to frontend/
   - So use: `.next` (NOT `frontend/.next`)
5. **Install Command**: Leave EMPTY or: `npm install`

### Step 4: Verify Environment Variables
In **Settings** → **Environment Variables**:
- Make sure `NEXT_PUBLIC_API_URL` is set (if needed)

### Step 5: Redeploy
1. Go to **Deployments** tab
2. Find your latest deployment
3. Click the three dots (⋯)
4. Click **Redeploy**
5. Wait for build to complete

## Alternative: If Still Not Working

### Option A: Check Build Logs
1. Open your deployment
2. Go to **Build Logs** tab
3. Look for errors, especially:
   - Build command errors
   - Module not found errors
   - TypeScript errors
4. Share the error messages if deployment fails

### Option B: Test Build Locally
```powershell
cd frontend
npm install
npm run build
npm start
```
If this works locally but fails on Vercel, the issue is in Vercel configuration.

### Option C: Reset Project Settings
1. Go to **Settings** → **General**
2. Click **Reset** on Build & Development Settings
3. Let Vercel auto-detect everything
4. Only set **Root Directory** to `frontend`
5. Don't set Build Command or Output Directory manually
6. Redeploy

## Quick Checklist

✅ Root Directory: `frontend` (in Dashboard)
✅ Framework Preset: `Next.js`
✅ Build Command: Empty or `npm run build` (NOT with `cd frontend`)
✅ Output Directory: Empty or `.next` (NOT `frontend/.next`)
✅ Install Command: Empty or `npm install`
✅ Environment Variables: Set if needed
✅ Redeployed after changes

## Common Mistakes

❌ **WRONG**: Output Directory = `frontend/.next` (when Root Directory is `frontend`)
✅ **CORRECT**: Output Directory = `.next` (relative to Root Directory)

❌ **WRONG**: Build Command = `cd frontend && npm run build`
✅ **CORRECT**: Build Command = `npm run build` (runs from Root Directory)

❌ **WRONG**: Root Directory not set or set incorrectly
✅ **CORRECT**: Root Directory = `frontend`

## Still Having Issues?

If you're still getting 404 after following these steps:
1. Check Build Logs for specific errors
2. Verify that `frontend/package.json` exists
3. Verify that `frontend/next.config.js` exists
4. Make sure Next.js version is compatible (14.0.4 should work)
5. Try deleting the project and re-importing from GitHub
