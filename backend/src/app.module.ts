import { Module } from "@nestjs/common"
import { APP_GUARD } from "@nestjs/core"
import { MongooseModule } from "@nestjs/mongoose"
import { ConfigModule } from "@nestjs/config"
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler"
import { ServeStaticModule } from "@nestjs/serve-static"
import { join } from "path"
import { BuyersModule } from "buyers/buyers.module"
import { AuthModule } from "auth/auth.module"
import { CompanyProfileModule } from "company-profile/company-profile.module"
import { AdminModule } from "admin/admin.module"
import { SellersModule } from "sellers/sellers.module"
import { DealsModule } from "deals/deals.module"
import { DealTrackingModule } from "deal-tracking/deal-tracking.module"
import { DealsService } from "deals/deals.service"
import { MailModule } from './mail/mail.module';
import { ClassificationModule } from './classification/classification.module';
import { TeamModule } from './team/team.module';
import { validateEnvironment } from "./config/env.validation";


import { CronModule } from './cron/cron.module';
// import { TestModule } from './test/test.module'; // Disabled for Vercel
import { ScheduleModule } from '@nestjs/schedule';
import * as path from 'path';
import { existsSync } from 'fs';

const isVercel = !!process.env.VERCEL || !existsSync(join(__dirname, '..', 'Uploads'));

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // On Vercel, env vars are injected into process.env directly — no .env file needed
      envFilePath: process.env.VERCEL === '1' ? [] : join(__dirname, '..', '.env'),
      validate: validateEnvironment,
    }),
    ThrottlerModule.forRoot([
      {
        name: "default",
        ttl: 60000,
        limit: 20,
      },
    ]),
    MongooseModule.forRoot(process.env.MONGODB_URI as string),
    // ServeStaticModule only for local dev — Vercel has read-only filesystem
    ...(isVercel ? [] : [
      ServeStaticModule.forRoot({
        rootPath: join(__dirname, "..", "Uploads"),
        serveRoot: "/Uploads",
      }),
    ]),
    // ScheduleModule.forRoot(), // Disabled for Vercel (10s timeout)
    BuyersModule,
    AuthModule,
    CompanyProfileModule,
    AdminModule,
    SellersModule,
    DealsModule,
    DealTrackingModule,
    MailModule,
    // CronModule, // Disabled for Vercel
    // TestModule, // Disabled for Vercel
    ClassificationModule,
    TeamModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
  controllers: [],
})
export class AppModule { }
