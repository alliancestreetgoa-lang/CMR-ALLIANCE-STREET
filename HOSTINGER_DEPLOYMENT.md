# Hostinger Node.js Deployment Guide

This guide explains how to deploy the Alliance Street Accounting ERP on Hostinger.

## Prerequisites
- Hostinger account with Node.js hosting plan
- Git repository (GitHub, GitLab, or Bitbucket)
- Your database connection string

## Step 1: Connect Your Repository to Hostinger

1. Log in to **Hostinger Dashboard**
2. Go to **Websites** → **Node.js Applications**
3. Click **Create Application** or **Add New Project**
4. Select your Git provider (GitHub, GitLab, Bitbucket)
5. Authorize Hostinger and select your repository
6. Choose the branch to deploy (usually `main` or `master`)

## Step 2: Configure Build & Start Commands

In Hostinger deployment settings:

**Build Command:**
```
npm run build
```

**Start/Run Command:**
```
npm start
```

These are already configured in `package.json`.

## Step 3: Set Environment Variables

In Hostinger Dashboard, go to **Environment Variables** and add:

1. **DATABASE_URL** (Required)
   - Your PostgreSQL connection string
   - Example: `postgresql://user:password@host:5432/dbname?sslmode=require`

2. **JWT_SECRET** (Required)
   - A strong random string for token signing
   - Example: `your-super-secret-key-change-this-in-production`

3. **NODE_ENV** (Optional)
   - Set to: `production`

## Step 4: Deploy

1. Click **Deploy** or **Redeploy** in Hostinger
2. Hostinger will:
   - Clone your repository
   - Install dependencies (`npm install`)
   - Build the app (`npm run build`)
   - Start the app (`npm start`)
   - Assign a public domain with SSL

## Step 5: Verify Deployment

After deployment:
1. Visit your assigned domain
2. You should see the login page
3. Login with credentials:
   - Username: `Shaukin`
   - Password: `Sapna@12345$$` (default, change this!)

## Troubleshooting

### App Won't Start
- Check **Build logs** in Hostinger Dashboard
- Ensure `DATABASE_URL` is correct and accessible
- Verify all environment variables are set

### Login Failing
- Ensure `DATABASE_URL` points to the correct database
- Check that the database has been initialized (tables created)
- Verify `JWT_SECRET` is set

### Port Issues
- Hostinger assigns the PORT automatically
- The app respects the PORT environment variable
- Do NOT hardcode a specific port

## Node.js Version

This application requires:
- **Node.js 20** or higher

Hostinger should automatically detect this from:
- `.nvmrc` file (if present)
- `package.json` engines field (if specified)

To verify/set in Hostinger, check your application settings for Node.js version selection.

## Database Migrations

If you update the database schema:
1. Run locally: `npm run db:push`
2. This pushes schema changes to your database
3. Hostinger will use the updated schema on next deployment

## Deployment Workflow

Each time you push to GitHub:
1. Hostinger auto-detects changes
2. Runs `npm run build`
3. Starts the app with `npm start`
4. Updates your public domain

## Support

For Hostinger-specific issues:
- Check Hostinger documentation: https://support.hostinger.com
- Review build logs in Hostinger Dashboard
- Verify environment variables are set correctly
