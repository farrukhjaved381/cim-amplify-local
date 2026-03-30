// src/mail/mail.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CommunicationLog, CommunicationLogSchema } from './schemas/communication-log.schema';
import { EmailQueue, EmailQueueSchema } from './schemas/email-queue.schema';
import { MailService } from './mail.service';
import { MailController } from './mail.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CommunicationLog.name, schema: CommunicationLogSchema },
      { name: EmailQueue.name, schema: EmailQueueSchema },
    ]),
  ],
  controllers: [MailController],
  providers: [MailService],
  exports: [MailService],  // make sure to export MailService for other modules
})
export class MailModule {}
