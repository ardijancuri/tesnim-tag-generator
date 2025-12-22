# Vercel Deployment Guide

This guide will walk you through deploying the TESNIM Tag Generator to Vercel.

## Prerequisites

- A GitHub account (recommended) or Git repository
- Node.js installed on your local machine
- Your project code committed to Git

## Method 1: Deploy via Vercel Dashboard (Recommended)

### Step 1: Push Your Code to GitHub

1. Make sure all your changes are committed:
   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   ```

2. Push to your GitHub repository:
   ```bash
   git push origin master
   ```

### Step 2: Connect to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in (or create an account)
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository:
   - Click **"Import Git Repository"**
   - Select `ardijancuri/tesnim-tag-generator` (or your repository)
   - Click **"Import"**

### Step 3: Configure Project Settings

Vercel should auto-detect your project settings, but verify:

1. **Framework Preset**: Leave as "Other" or "Vite" (auto-detected)
2. **Root Directory**: Leave as `./` (root)
3. **Build Command**: `npm run vercel-build`
4. **Output Directory**: `frontend/dist`
5. **Install Command**: `npm run install:all`

### Step 4: Environment Variables (Optional)

If you need custom API URLs, add environment variables:
- Go to **Settings** → **Environment Variables**
- Add `VITE_API_URL` if needed (leave empty for default `/api/generate-pdf`)

### Step 5: Deploy

1. Click **"Deploy"**
2. Wait for the build to complete (this may take a few minutes)
3. Once deployed, you'll get a URL like: `https://tesnim-tag-generator.vercel.app`

## Method 2: Deploy via Vercel CLI

### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

### Step 2: Login to Vercel

```bash
vercel login
```

This will open your browser to authenticate.

### Step 3: Deploy

From your project root directory:

```bash
vercel
```

Follow the prompts:
- **Set up and deploy?** → Yes
- **Which scope?** → Select your account/team
- **Link to existing project?** → No (for first deployment)
- **Project name?** → `tesnim-tag-generator` (or your preferred name)
- **Directory?** → `./` (current directory)
- **Override settings?** → No (uses vercel.json)

### Step 4: Production Deployment

For production deployment:

```bash
vercel --prod
```

## Post-Deployment

### Verify Deployment

1. Visit your deployment URL
2. Test the PDF generation:
   - Fill out the form
   - Click "Generate PDF Tag"
   - Verify the PDF downloads correctly

### Check Logs

If something goes wrong:
1. Go to Vercel Dashboard
2. Select your project
3. Click **"Deployments"** → Select the deployment
4. Click **"Functions"** tab to see serverless function logs
5. Check **"Build Logs"** for build errors

## Troubleshooting

### Issue: Build Fails

**Solution:**
- Check build logs in Vercel dashboard
- Ensure all dependencies are listed in package.json files
- Verify Node.js version (Vercel uses Node 18.x by default)

### Issue: Fonts Not Found

**Solution:**
- The build script should download fonts automatically
- Check that `backend/download-fonts.js` runs during build
- Verify `backend/fonts/` directory is not in `.gitignore`

### Issue: API Endpoint Returns 404

**Solution:**
- Verify `api/generate-pdf.js` exists
- Check that routes in `vercel.json` are correct
- Ensure the function is in the `api/` directory (not `backend/`)

### Issue: Canvas/PDF Generation Fails

**Solution:**
- The project now uses `bwip-js` instead of `canvas` for barcode generation (serverless-friendly)
- If you still encounter issues, check function logs for specific errors
- Verify memory allocation (set to 1024MB in vercel.json)
- Increase timeout if PDF generation takes longer than 30s

### Issue: CORS Errors

**Solution:**
- The API should work on the same domain, so CORS shouldn't be an issue
- If using a custom domain, ensure it's properly configured in Vercel

## Custom Domain Setup (Optional)

1. Go to Vercel Dashboard → Your Project → **Settings** → **Domains**
2. Add your custom domain
3. Follow DNS configuration instructions
4. Wait for DNS propagation (can take up to 48 hours)

## Updating Your Deployment

### Automatic Updates (GitHub Integration)

- Every push to your main/master branch automatically triggers a new deployment
- Preview deployments are created for pull requests

### Manual Updates (CLI)

```bash
vercel --prod
```

## Project Structure for Vercel

```
tesnim-tag-generator/
├── api/
│   ├── generate-pdf.js      # Serverless function
│   └── package.json         # API dependencies
├── backend/
│   ├── pdfGenerator.js      # PDF generation logic
│   ├── fonts/               # Inter font files
│   └── package.json         # Backend dependencies
├── frontend/
│   ├── dist/                # Build output (generated)
│   ├── src/
│   └── package.json         # Frontend dependencies
├── vercel.json              # Vercel configuration
└── package.json             # Root package.json with build scripts
```

## Important Notes

1. **Fonts**: The build process automatically downloads Inter fonts if they don't exist
2. **Dependencies**: All dependencies (root, frontend, backend, api) are installed during build
3. **API Routes**: All `/api/*` requests are routed to serverless functions
4. **Frontend Routes**: All other routes serve the React app
5. **Memory**: Serverless function has 1024MB memory allocated
6. **Timeout**: Serverless function timeout is 30 seconds

## Support

If you encounter issues:
1. Check Vercel documentation: [vercel.com/docs](https://vercel.com/docs)
2. Review build logs in Vercel dashboard
3. Check serverless function logs for API errors

