#!/usr/bin/env pwsh

Write-Host "🚀 Deploying CIM Amplify Frontend to Vercel..." -ForegroundColor Green

# Navigate to frontend directory
Set-Location frontend

# Build the project
Write-Host "📦 Building frontend..." -ForegroundColor Yellow
npm run build

# Deploy to Vercel
Write-Host "🌐 Deploying to Vercel..." -ForegroundColor Yellow
vercel --prod

Write-Host "✅ Frontend deployment complete!" -ForegroundColor Green
Write-Host "🔗 Frontend URL: https://cim-amplify-five.vercel.app" -ForegroundColor Cyan