#!/usr/bin/env pwsh

Write-Host "🚀 Deploying CIM Amplify Backend to Vercel..." -ForegroundColor Green

# Navigate to backend directory
Set-Location backend

# Build the project
Write-Host "📦 Building backend..." -ForegroundColor Yellow
npm run build

# Deploy to Vercel
Write-Host "🌐 Deploying to Vercel..." -ForegroundColor Yellow
vercel --prod

Write-Host "✅ Backend deployment complete!" -ForegroundColor Green
Write-Host "🔗 Backend URL: https://cim-backend.vercel.app" -ForegroundColor Cyan
Write-Host "📚 API Docs: https://cim-backend.vercel.app/api-docs" -ForegroundColor Cyan