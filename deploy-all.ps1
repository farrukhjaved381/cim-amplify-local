#!/usr/bin/env pwsh

Write-Host "🚀 Deploying CIM Amplify (Full Stack) to Vercel..." -ForegroundColor Green

# Deploy Backend First
Write-Host "📡 Step 1: Deploying Backend..." -ForegroundColor Yellow
Set-Location backend
npm run build
vercel --prod
Set-Location ..

Write-Host "⏳ Waiting 10 seconds for backend to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Deploy Frontend
Write-Host "🎨 Step 2: Deploying Frontend..." -ForegroundColor Yellow
Set-Location frontend
npm run build
vercel --prod
Set-Location ..

Write-Host "✅ Full deployment complete!" -ForegroundColor Green
Write-Host ""
Write-Host "🔗 Live URLs:" -ForegroundColor Cyan
Write-Host "   Frontend: https://cim-amplify-five.vercel.app" -ForegroundColor White
Write-Host "   Backend:  https://cim-backend.vercel.app" -ForegroundColor White
Write-Host "   API Docs: https://cim-backend.vercel.app/api-docs" -ForegroundColor White
Write-Host ""
Write-Host "🏠 Local Development URLs:" -ForegroundColor Cyan
Write-Host "   Frontend: https://cim-amplify-five.vercel.app" -ForegroundColor White
Write-Host "   Backend:  https://cim-backend.vercel.app" -ForegroundColor White