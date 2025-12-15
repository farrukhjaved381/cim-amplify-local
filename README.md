# CIM Amplify - Local Development

A full-stack M&A deal management platform built with Next.js and NestJS.

## Project Structure

```
├── frontend/          # Next.js frontend application
├── backend/          # NestJS backend API
└── README.md         # This file
```

## Prerequisites

- Node.js 18+ and npm/yarn
- MongoDB Atlas account (or local MongoDB)
- Git

## Backend Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# Database
MONGODB_URI=mongodb+srv://your-connection-string

# JWT
JWT_SECRET=your-secure-jwt-secret-minimum-32-characters-long
JWT_EXPIRES_IN=1d

# Email Configuration
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Google OAuth (Optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Frontend/Backend URLs
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:3001

# Environment
NODE_ENV=development
PORT=3001
```

### 3. Build Backend

```bash
cd backend
npm run build
```

### 4. Run Backend

**Development mode:**
```bash
npm run start:dev
```

**Production mode:**
```bash
npm run start:prod
```

The backend will run on `http://localhost:3001`

**Note:** The backend is configured for Vercel serverless functions. For local development, you may need to modify `main.ts` to listen on a port.

## Frontend Setup

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Environment Variables

Create a `.env.local` file in the `frontend/` directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 3. Run Frontend

```bash
npm run dev
```

The frontend will run on `http://localhost:3000`

## Common Backend Issues

### Backend Not Starting

1. **Check MongoDB Connection:**
   - Ensure `MONGODB_URI` is set correctly
   - Verify MongoDB Atlas IP whitelist includes your IP

2. **Missing Environment Variables:**
   - Ensure all required `.env` variables are set
   - Check for typos in variable names

3. **Port Already in Use:**
   - Change `PORT` in `.env` or kill the process using port 3001

4. **Build Errors:**
   - Run `npm run build` in backend directory
   - Check for TypeScript errors

### For Vercel Deployment

The backend is configured for Vercel serverless. See `backend/README-VERCEL.md` for deployment instructions.

## Git Setup

This repository is configured to push to:
`https://github.com/farrukhjaved381/cim-amplify-local.git`

## License

Private - All Rights Reserved

