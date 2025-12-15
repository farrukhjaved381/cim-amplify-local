# Backend Setup & Troubleshooting Guide

## Why Backend Was Not Running Properly

The backend was configured **only for Vercel serverless functions** and didn't have local development support. I've fixed this by updating `backend/src/main.ts` to support both local development and Vercel deployment.

## Fixed Issues

1. ✅ **Added local server listener** - Backend now listens on port 3001 for local development
2. ✅ **Created proper .gitignore** - Prevents committing sensitive files
3. ✅ **Added README.md** - Setup instructions for the project

## How to Run Backend Locally

### Step 1: Install Dependencies
```bash
cd backend
npm install
```

### Step 2: Create Environment File
Create `backend/.env` file with these variables:

```env
# Database - REQUIRED
MONGODB_URI=mongodb+srv://your-username:your-password@cluster.mongodb.net/cim-amplify?retryWrites=true&w=majority

# JWT - REQUIRED (minimum 32 characters)
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
JWT_EXPIRES_IN=1d

# Email Configuration - REQUIRED
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-specific-password

# URLs - REQUIRED
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:3001

# Environment
NODE_ENV=development
PORT=3001
```

### Step 3: Build Backend
```bash
npm run build
```

### Step 4: Run Backend
```bash
# Development mode (with hot reload)
npm run start:dev

# OR Production mode
npm run start:prod
```

The backend will now run on `http://localhost:3001`

## Common Issues & Solutions

### Issue 1: "Cannot find module" errors
**Solution:** Run `npm install` in the backend directory

### Issue 2: MongoDB connection errors
**Solution:** 
- Check your `MONGODB_URI` is correct
- Ensure MongoDB Atlas IP whitelist includes `0.0.0.0/0` (all IPs) or your specific IP
- Verify database user has proper permissions

### Issue 3: Port already in use
**Solution:**
```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:3001 | xargs kill -9
```

### Issue 4: Environment variables not loading
**Solution:**
- Ensure `.env` file is in `backend/` directory (not root)
- Check for typos in variable names
- Restart the server after changing `.env`

### Issue 5: Build errors
**Solution:**
```bash
cd backend
rm -rf dist node_modules
npm install
npm run build
```

## Testing Backend

Once running, test these endpoints:

1. **Health Check:** `http://localhost:3001/`
2. **Swagger Docs:** `http://localhost:3001/api-docs`
3. **API Test:** `http://localhost:3001/auth/health`

## For Vercel Deployment

The backend still works on Vercel! The code automatically detects the environment:
- **Local:** Runs as a regular server on port 3001
- **Vercel:** Runs as serverless functions

See `backend/README-VERCEL.md` for Vercel deployment instructions.

## Next Steps

1. ✅ Backend can now run locally
2. ✅ Code pushed to GitHub
3. ⏭️ Set up MongoDB Atlas
4. ⏭️ Configure email service
5. ⏭️ Test API endpoints

