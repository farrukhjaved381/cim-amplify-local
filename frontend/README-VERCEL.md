# CIM Amplify Frontend - Vercel Deployment Guide

## Prerequisites
- Vercel account
- Backend deployed and URL ready

## Deployment Steps

### 1. Install Vercel CLI (if not already)
```bash
npm install -g vercel
```

### 2. Login to Vercel
```bash
vercel login
```

### 3. Deploy Frontend
```bash
cd frontend
vercel
```

### 4. Configure Environment Variables

In Vercel Dashboard, add:

```
NEXT_PUBLIC_API_URL=https://your-backend.vercel.app
```

### 5. Production Deployment
```bash
vercel --prod
```

## Update Backend URL

After frontend is deployed, update backend's `FRONTEND_URL`:

1. Go to backend Vercel project
2. Settings → Environment Variables
3. Update `FRONTEND_URL` to your frontend URL
4. Redeploy backend

## Testing

1. Visit: `https://your-frontend.vercel.app`
2. Test login/register
3. Check API connectivity

## Common Issues

### API Connection Failed
- Check `NEXT_PUBLIC_API_URL` is correct
- Verify backend is running
- Check CORS settings in backend

### Build Errors
```bash
# Clear cache
vercel --force
```

### Images Not Loading
- Already configured with `unoptimized: true`
- Should work out of the box

## Performance Tips

1. Enable Vercel Analytics
2. Use Vercel Image Optimization (remove unoptimized flag)
3. Enable caching headers
4. Monitor Core Web Vitals
