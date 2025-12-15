# CIM Amplify - Vercel Architecture

## 🏗️ Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         USERS                                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    VERCEL CDN (Global)                       │
└─────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┴─────────────┐
                ▼                           ▼
┌───────────────────────────┐   ┌───────────────────────────┐
│   FRONTEND (Next.js)      │   │   BACKEND (NestJS)        │
│   Vercel Serverless       │   │   Vercel Serverless       │
│                           │   │                           │
│   - Static Pages          │   │   - REST API              │
│   - React Components      │   │   - Authentication        │
│   - Client-side Logic     │   │   - Business Logic        │
│                           │   │   - Swagger Docs          │
│   URL: your-frontend      │   │   URL: your-backend       │
│        .vercel.app        │   │        .vercel.app        │
└───────────────────────────┘   └───────────────────────────┘
                                              │
                                ┌─────────────┼─────────────┐
                                ▼             ▼             ▼
                    ┌─────────────────┐ ┌──────────┐ ┌──────────┐
                    │  MongoDB Atlas  │ │Cloudinary│ │  Gmail   │
                    │   (Database)    │ │  (Files) │ │ (Email)  │
                    └─────────────────┘ └──────────┘ └──────────┘
```

## 📊 Data Flow

### User Registration Flow
```
User → Frontend → Backend → MongoDB → Email Service → User
  1. Fill form
  2. POST /auth/register
  3. Hash password, save user
  4. Send verification email
  5. Receive email
```

### File Upload Flow (with Cloudinary)
```
User → Frontend → Backend → Cloudinary → Database
  1. Select file
  2. POST /deals/:id/upload
  3. Upload to Cloudinary
  4. Save URL in MongoDB
```

### API Request Flow
```
Frontend → Backend → Database → Backend → Frontend
  1. Make API call with JWT
  2. Validate JWT
  3. Query database
  4. Return data
  5. Update UI
```

## 🔐 Security Layers

```
┌─────────────────────────────────────────┐
│  Layer 1: Vercel Firewall               │
│  - DDoS Protection                      │
│  - Rate Limiting                        │
└─────────────────────────────────────────┘
                  │
┌─────────────────────────────────────────┐
│  Layer 2: CORS Policy                   │
│  - Allowed Origins Only                 │
│  - Credentials Required                 │
└─────────────────────────────────────────┘
                  │
┌─────────────────────────────────────────┐
│  Layer 3: JWT Authentication            │
│  - Token Validation                     │
│  - Role-based Access                    │
└─────────────────────────────────────────┘
                  │
┌─────────────────────────────────────────┐
│  Layer 4: Input Validation              │
│  - Schema Validation                    │
│  - Sanitization                         │
└─────────────────────────────────────────┘
                  │
┌─────────────────────────────────────────┐
│  Layer 5: Database Security             │
│  - IP Whitelist                         │
│  - Encrypted Connection                 │
│  - User Permissions                     │
└─────────────────────────────────────────┘
```

## 🌍 Environment Variables Flow

### Backend Environment Variables
```
Vercel Dashboard
    │
    ├─ MONGODB_URI ────────────► MongoDB Atlas
    ├─ JWT_SECRET ─────────────► Token Signing
    ├─ EMAIL_USER ─────────────► Gmail SMTP
    ├─ GOOGLE_CLIENT_ID ───────► OAuth
    ├─ STRIPE_SECRET_KEY ──────► Payments
    ├─ CLOUDINARY_* ───────────► File Storage
    ├─ FRONTEND_URL ───────────► CORS Config
    └─ BACKEND_URL ────────────► Swagger Config
```

### Frontend Environment Variables
```
Vercel Dashboard
    │
    └─ NEXT_PUBLIC_API_URL ────► Backend API Calls
```

## 📁 File Structure

### Backend (NestJS)
```
backend/
├── src/
│   ├── auth/           # Authentication
│   ├── buyers/         # Buyer management
│   ├── sellers/        # Seller management
│   ├── deals/          # Deal management
│   ├── admin/          # Admin functions
│   ├── mail/           # Email service
│   ├── cron/           # Scheduled tasks
│   └── main.ts         # Entry point
├── vercel.json         # Vercel config
├── .vercelignore       # Ignore files
└── package.json        # Dependencies
```

### Frontend (Next.js)
```
frontend/
├── app/                # Next.js 15 app directory
│   ├── admin/          # Admin pages
│   ├── buyer/          # Buyer pages
│   ├── seller/         # Seller pages
│   └── api/            # API routes
├── components/         # React components
├── services/           # API services
├── vercel.json         # Vercel config
├── .vercelignore       # Ignore files
└── package.json        # Dependencies
```

## 🔄 Deployment Pipeline

```
Local Development
    │
    ├─ git commit
    │
    ▼
GitHub Repository
    │
    ├─ git push
    │
    ▼
Vercel (Auto Deploy)
    │
    ├─ Install dependencies
    ├─ Run build
    ├─ Deploy to CDN
    │
    ▼
Production (Live)
```

## 📈 Scaling Strategy

### Current Setup (Serverless)
- ✅ Auto-scaling
- ✅ Pay per use
- ✅ Global CDN
- ⚠️ Cold starts
- ⚠️ 10s timeout

### Future Scaling Options
1. **Vercel Pro** - More resources
2. **Dedicated Server** - No cold starts
3. **Microservices** - Split services
4. **Caching Layer** - Redis/Memcached

## 🎯 Performance Optimization

### Frontend
- Static page generation
- Image optimization
- Code splitting
- CDN delivery

### Backend
- Database indexing
- Query optimization
- Response caching
- Connection pooling

## 🔍 Monitoring Points

```
Frontend Monitoring
    ├─ Page Load Time
    ├─ API Response Time
    ├─ Error Rate
    └─ User Analytics

Backend Monitoring
    ├─ Function Invocations
    ├─ Error Rate
    ├─ Response Time
    └─ Database Queries

Database Monitoring
    ├─ Connection Count
    ├─ Query Performance
    ├─ Storage Usage
    └─ Index Usage
```

## 🚀 Deployment Workflow

```
1. Prepare Credentials
   └─ Generate new secrets

2. Setup MongoDB Atlas
   └─ Create cluster & user

3. Deploy Backend
   ├─ vercel
   ├─ Add env vars
   └─ vercel --prod

4. Deploy Frontend
   ├─ vercel
   ├─ Add env vars
   └─ vercel --prod

5. Update Backend
   └─ Add frontend URL

6. Test Everything
   ├─ Swagger
   ├─ Frontend
   └─ API calls

7. Setup File Storage
   └─ Cloudinary integration

8. Monitor & Maintain
   └─ Check logs regularly
```

## 📊 Cost Estimation

### Vercel (Free Tier)
- ✅ 100GB bandwidth/month
- ✅ Unlimited deployments
- ✅ Automatic HTTPS
- ⚠️ Upgrade for production

### MongoDB Atlas (Free Tier)
- ✅ 512MB storage
- ✅ Shared cluster
- ⚠️ Upgrade for production

### Cloudinary (Free Tier)
- ✅ 25GB storage
- ✅ 25GB bandwidth
- ⚠️ Upgrade for production

**Estimated Monthly Cost (Production):**
- Vercel Pro: $20/month
- MongoDB Atlas M10: $57/month
- Cloudinary Plus: $89/month
- **Total: ~$166/month**

## 🎉 Benefits of This Architecture

✅ **Scalable** - Auto-scales with traffic
✅ **Secure** - Multiple security layers
✅ **Fast** - Global CDN delivery
✅ **Reliable** - 99.9% uptime
✅ **Cost-effective** - Pay per use
✅ **Easy to maintain** - Managed services
✅ **Developer-friendly** - Simple deployment

## 🔮 Future Enhancements

1. **Custom Domain** - Professional URLs
2. **CDN Optimization** - Faster delivery
3. **Caching Layer** - Redis integration
4. **Monitoring** - Advanced analytics
5. **CI/CD Pipeline** - Automated testing
6. **Backup Strategy** - Data protection
7. **Load Balancing** - Better distribution
8. **Microservices** - Service separation
