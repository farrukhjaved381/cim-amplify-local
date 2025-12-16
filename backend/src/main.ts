import "./shims"
import { NestFactory } from "@nestjs/core"
import { ValidationPipe } from "@nestjs/common"
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger"
import { NestExpressApplication } from '@nestjs/platform-express'
import { join } from 'path'
import { AppModule } from "./app.module"
import * as express from "express"

let cachedApp: NestExpressApplication;

async function bootstrap() {
  if (cachedApp) {
    return cachedApp;
  }

  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  let frontendUrl = process.env.FRONTEND_URL || "http://localhost:5000"
  // Remove trailing slash if present
  if (frontendUrl.endsWith("/")) {
    frontendUrl = frontendUrl.slice(0, -1)
  }
  // Increase body size limit for large uploads (e.g., base64 images)
  app.use(express.json({ limit: '10mb' }))
  app.use(express.urlencoded({ limit: '10mb', extended: true }))
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  )
  // Fix CORS configuration
  const allowedOrigins = [
    "https://cim-amplify-five.vercel.app",
    process.env.FRONTEND_URL,
    "http://localhost:5000",
    "http://localhost:3000", // Keep for backward compatibility
  ].filter(Boolean);
  
  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) {
        callback(null, true);
        return;
      }
      
      // Check if origin is allowed
      const isAllowed = allowedOrigins.some(allowed => 
        allowed && (origin.includes(allowed) || origin === allowed || origin.includes('.vercel.app'))
      );
      
      if (isAllowed) {
        callback(null, true);
      } else {
        callback(null, true); // Allow all for now, restrict in production
      }
    },
    credentials: true,
  })
  // Setup Swagger with CDN assets for Vercel
  const config = new DocumentBuilder()
    .setTitle("CIM Amplify API")
    .setDescription("The CIM Amplify API documentation")
    .setVersion("1.0")
    .addTag("auth")
    .addTag("buyers")
    .addTag("admin")
    .addTag("sellers")
    .addTag("deals")
    .addTag("deal-tracking")
    .addTag("company-profiles")
    .addBearerAuth()
    .addServer(process.env.BACKEND_URL || 'http://localhost:5001', 'Production')
    .addServer('http://localhost:5001', 'Development')
    .build()
  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup("api-docs", app, document, {
    customSiteTitle: 'CIM Amplify API',
    customCssUrl: 'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui.min.css',
    customJs: [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui-bundle.js',
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui-standalone-preset.js',
    ],
    swaggerOptions: {
      persistAuthorization: true,
    },
  })

  const port = process.env.PORT || 5001;
  
  // Only listen on port if not in Vercel environment
  if (process.env.VERCEL !== '1') {
    await app.listen(port);
    console.log(`🚀 Backend server running on http://localhost:${port}`);
    console.log(`📚 Swagger docs available at http://localhost:${port}/api-docs`);
  } else {
    await app.init();
  }
  
  cachedApp = app;
  return app;
}

// Call bootstrap when running locally (not in Vercel)
// This ensures the server starts when running npm run start:dev or npm run start
if (process.env.VERCEL !== '1' && require.main === module) {
  bootstrap().catch((error) => {
    console.error('❌ Error starting server:', error);
    process.exit(1);
  });
}

// Vercel serverless handler
export default async (req, res) => {
  const app = await bootstrap();
  const server = app.getHttpAdapter().getInstance();
  return server(req, res);
};