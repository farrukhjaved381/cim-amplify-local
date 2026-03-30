# CIM Amplify - Quick Deployment Guide

## 🚀 Environment Setup Complete!

Your CIM Amplify application is now configured for both local development and Vercel production deployment.

## 📍 URLs

### Local Development
- **Frontend**: https://cim-amplify-five.vercel.app
- **Backend**: https://cim-backend.vercel.app
- **API Docs**: https://cim-backend.vercel.app/api-docs

### Production (Vercel)
- **Frontend**: https://cim-amplify-five.vercel.app
- **Backend**: https://cim-backend.vercel.app
- **API Docs**: https://cim-backend.vercel.app/api-docs

## 🏃‍♂️ Quick Start

### Local Development

1. **Start Backend** (Terminal 1):
   ```bash
   cd backend
   npm run start:dev
   ```

2. **Start Frontend** (Terminal 2):
   ```bash
   cd frontend
   npm run dev
   ```

### Deploy to Vercel

#### Option 1: Deploy Both (Recommended)
```bash
# Windows PowerShell
./deploy-all.ps1

# Linux/Mac
./deploy-all.sh
```

#### Option 2: Deploy Individually
```bash
# Backend only
./deploy-backend.ps1  # Windows
./deploy-backend.sh   # Linux/Mac

# Frontend only
./deploy-frontend.ps1  # Windows
./deploy-frontend.sh   # Linux/Mac
```

#### Option 3: Manual Deployment
```bash
# Backend
cd backend
npm run build
vercel --prod

# Frontend
cd frontend
npm run build
vercel --prod
```

## ⚙️ Environment Configuration

### Backend Environment Variables

#### Local (`.env`)
```env
FRONTEND_URL=https://cim-amplify-five.vercel.app
BACKEND_URL=https://cim-backend.vercel.app
```

#### Production (`.env.production` + Vercel Dashboard)
```env
FRONTEND_URL=https://cim-amplify-five.vercel.app
BACKEND_URL=https://cim-backend.vercel.app
```

### Frontend Environment Variables

#### Local (`.env.local`)
```env
NEXT_PUBLIC_API_URL=https://cim-backend.vercel.app
```

#### Production (`.env.production` + Vercel Dashboard)
```env
NEXT_PUBLIC_API_URL=https://cim-backend.vercel.app
```

## 🔧 First Time Setup

### 1. Install Vercel CLI
```bash
npm install -g vercel
```

### 2. Login to Vercel
```bash
vercel login
```

### 3. Set Environment Variables in Vercel Dashboard

For **Backend** project:
- Go to https://vercel.com/dashboard
- Select your backend project (`cim-backend`)
- Settings > Environment Variables
- Add all variables from `backend/.env.production`

For **Frontend** project:
- Go to https://vercel.com/dashboard  
- Select your frontend project (`cim-amplify-five`)
- Settings > Environment Variables
- Add: `NEXT_PUBLIC_API_URL=https://cim-backend.vercel.app`

## 🔍 Verification

After deployment, verify everything works:

1. **Backend Health**: Visit https://cim-backend.vercel.app/api-docs
2. **Frontend Loading**: Visit https://cim-amplify-five.vercel.app
3. **API Integration**: Test user registration/login

## 📝 Important Notes

- **Database**: Both local and production use the same MongoDB Atlas database
- **CORS**: Backend accepts requests from both local and production frontend URLs
- **Ports**: Local development uses ports 5000 (frontend) and 5001 (backend)
- **Auto-Deploy**: Vercel automatically deploys when you push to main branch
- **Environment**: Use `.env` for local, set variables in Vercel dashboard for production

## 🐛 Troubleshooting

### Common Issues

1. **CORS Errors**: Check `FRONTEND_URL` matches exactly in backend environment
2. **API Not Found**: Verify `NEXT_PUBLIC_API_URL` in frontend environment
3. **Build Failures**: Run `npm run build` locally first to check for errors
4. **Environment Variables**: Ensure all required variables are set in Vercel dashboard

### Debug Steps

1. Check Vercel deployment logs in dashboard
2. Verify environment variables are set correctly
3. Test API endpoints directly in browser
4. Check browser console for frontend errors

## 📞 Support

If you encounter issues:
1. Check the detailed `DEPLOYMENT.md` guide
2. Review Vercel deployment logs
3. Verify all environment variables are set correctly
4. Test locally first before deploying to production

Happy deploying! 🎉