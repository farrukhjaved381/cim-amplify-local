#!/bin/bash

echo "🚀 Deploying CIM Amplify Backend to Vercel..."

# Navigate to backend directory
cd backend

# Build the project
echo "📦 Building backend..."
npm run build

# Deploy to Vercel
echo "🌐 Deploying to Vercel..."
vercel --prod

echo "✅ Backend deployment complete!"
echo "🔗 Backend URL: https://cim-backend.vercel.app"
echo "📚 API Docs: https://cim-backend.vercel.app/api-docs"