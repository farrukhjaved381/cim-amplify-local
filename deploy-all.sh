#!/bin/bash

echo "🚀 Deploying CIM Amplify (Full Stack) to Vercel..."

# Deploy Backend First
echo "📡 Step 1: Deploying Backend..."
cd backend
npm run build
vercel --prod
cd ..

echo "⏳ Waiting 10 seconds for backend to be ready..."
sleep 10

# Deploy Frontend
echo "🎨 Step 2: Deploying Frontend..."
cd frontend
npm run build
vercel --prod
cd ..

echo "✅ Full deployment complete!"
echo ""
echo "🔗 Live URLs:"
echo "   Frontend: https://cim-amplify-five.vercel.app"
echo "   Backend:  https://cim-backend.vercel.app"
echo "   API Docs: https://cim-backend.vercel.app/api-docs"
echo ""
echo "🏠 Local Development URLs:"
echo "   Frontend: https://cim-amplify-five.vercel.app"
echo "   Backend:  https://cim-backend.vercel.app"