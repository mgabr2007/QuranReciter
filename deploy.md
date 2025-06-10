# Deployment Guide

## Quick GitHub Upload

Since terminal pasting is restricted, here's the simplest approach:

### Method 1: Replit Git Integration
1. Click the "Version Control" icon in the left sidebar of Replit
2. Click "Connect to GitHub"
3. Authorize Replit to access your GitHub account
4. Create a new repository directly from Replit
5. Push your code with one click

### Method 2: Download and Upload
1. In Replit Files panel, right-click on the root folder
2. Select "Download as ZIP"
3. Go to GitHub.com and create a new repository
4. Use "uploading an existing file" option
5. Drag and drop your extracted files

### Method 3: Manual Git Commands
If you have terminal access, run these one by one:

```bash
git add .
```

```bash
git commit -m "Initial commit: Quran recitation app"
```

```bash
git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git
```

```bash
git push -u origin main
```

## Environment Setup for Production

1. Set up a PostgreSQL database (Railway, Supabase, or Heroku)
2. Configure environment variables:
   - `DATABASE_URL`
   - `SESSION_SECRET`
   - `NODE_ENV=production`

## Replit Deployment

Your app is already running on Replit at your project URL. To make it publicly accessible:
1. Ensure your Repl is public
2. Share your Replit URL: `https://your-repl-name.your-username.replit.app`

## Vercel Deployment

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy with automatic builds on git push

The app will be live at your Vercel domain.