# CIM Amplify Backend - Vercel Deployment Guide

## Prerequisites
- Vercel account
- MongoDB Atlas database
- All environment variables ready

## Deployment Steps

### 1. Install Vercel CLI
```bash
npm install -g vercel
```

### 2. Login to Vercel
```bash
vercel login
```

### 3. Deploy Backend
```bash
cd backend
vercel
```

### 4. Configure Environment Variables in Vercel Dashboard

Go to your project settings and add these variables:

**Required Variables:**
```
MONGODB_URI=mongodb+srv://your-connection-string
JWT_SECRET=your-new-secure-jwt-secret-min-32-chars
JWT_EXPIRES_IN=1d
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
STRIPE_SECRET_KEY=your-stripe-secret
STRIPE_PUBLISHABLE_KEY=your-stripe-publishable
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret
FRONTEND_URL=https://your-frontend.vercel.app
BACKEND_URL=https://your-backend.vercel.app
NODE_ENV=production
PORT=3000
```

**Optional:**
```
ANTHROPIC_API_KEY=your-anthropic-key
```

### 5. Production Deployment
```bash
vercel --prod
```

## Important Notes

### File Uploads
⚠️ **Vercel has read-only filesystem**. File uploads won't work on Vercel.

**Solutions:**
1. **Use Cloudinary** (Recommended)
2. **Use AWS S3**
3. **Use Vercel Blob Storage**

### Swagger Documentation
- Available at: `https://your-backend.vercel.app/api-docs`
- Make sure to update CORS settings after deployment

### Cron Jobs
⚠️ **Vercel Serverless Functions have 10-second timeout**

**Solutions:**
1. Use Vercel Cron Jobs (paid feature)
2. Use external cron service (cron-job.org)
3. Disable cron jobs for Vercel deployment

### Database
- Use MongoDB Atlas (cloud database)
- Ensure IP whitelist includes `0.0.0.0/0` for Vercel

## Testing Deployment

1. Check health: `https://your-backend.vercel.app/`
2. Check Swagger: `https://your-backend.vercel.app/api-docs`
3. Test API: `https://your-backend.vercel.app/auth/health`

## Troubleshooting

### Build Fails
```bash
# Clear cache and rebuild
vercel --force
```

### Environment Variables Not Working
- Check spelling in Vercel dashboard
- Redeploy after adding variables

### CORS Errors
- Update FRONTEND_URL in environment variables
- Check CORS configuration in main.ts

## Security Checklist
- [ ] Rotate all credentials from compromised server
- [ ] Use new JWT_SECRET (min 32 characters)
- [ ] Enable MongoDB IP whitelist
- [ ] Set up Vercel firewall rules
- [ ] Enable 2FA on Vercel account
- [ ] Review and limit API access
