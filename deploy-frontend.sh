#!/bin/bash

echo "🚀 Deploying CIM Amplify Frontend to Vercel..."

# Navigate to frontend directory
cd frontend

# Build the project
echo "📦 Building frontend..."
npm run build

# Deploy to Vercel
echo "🌐 Deploying to Vercel..."
vercel --prod

echo "✅ Frontend deployment complete!"
echo "🔗 Frontend URL: https://cim-amplify-five.vercel.app"