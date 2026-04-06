import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DealsService } from '../deals/deals.service';
import { MailService } from '../mail/mail.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Seller, SellerDocument } from '../sellers/schemas/seller.schema';
import { Buyer, BuyerDocument } from '../buyers/schemas/buyer.schema';
import { Deal, DealDocumentType } from '../deals/schemas/deal.schema';
import { genericEmailTemplate, emailButton } from '../mail/generic-email.template';
import { ILLUSTRATION_ATTACHMENT } from '../mail/mail.service';
import {
  advisorMonthlyReportTemplate,
  type AdvisorReportData,
  type ReportDeal,
  type ReportBuyer,
  type BuyerMovement,
} from '../mail/advisor-monthly-report.template';
import {
  buyerMonthlyReportTemplate,
  type BuyerReportData,
  type BuyerReportDeal,
} from '../mail/buyer-monthly-report.template';
import { EmailVerification, EmailVerificationDocument } from '../auth/schemas/email-verification.schema';
import { CompanyProfile, CompanyProfileDocument } from '../company-profile/schemas/company-profile.schema';
import { getFrontendUrl } from '../common/frontend-url';

const getFirstName = (fullName?: string | null): string => {
  const trimmed = fullName?.trim();
  if (!trimmed) return 'User';
  return trimmed.split(/\s+/)[0] || 'User';
};

@Injectable()
export class CronService {
  private readonly logger = new Logger(CronService.name);
  private formatError(error: unknown): string {
    if (error instanceof Error) {
      return error.stack || error.message;
    }
    return String(error);
  }

  constructor(
    private dealsService: DealsService,
    private mailService: MailService,
    @InjectModel(Seller.name) private sellerModel: Model<SellerDocument>,
    @InjectModel(Buyer.name) private buyerModel: Model<BuyerDocument>,
    @InjectModel(CompanyProfile.name) private companyProfileModel: Model<CompanyProfileDocument>,
    @InjectModel(EmailVerification.name) private emailVerificationModel: Model<EmailVerificationDocument>,
    @InjectModel(Deal.name) private dealModel: Model<DealDocumentType>,
  ) {}

  private isProfileComplete(profile: CompanyProfile): boolean {
    return !!(
      profile.companyName &&
      profile.companyName !== 'Set your company name' &&
      profile.website &&
      profile.companyType &&
      profile.companyType !== 'Other' &&
      profile.capitalEntity &&
      profile.dealsCompletedLast5Years !== undefined &&
      profile.averageDealSize !== undefined &&
      profile.targetCriteria?.countries?.length > 0 &&
      profile.targetCriteria?.industrySectors?.length > 0 &&
      profile.targetCriteria?.revenueMin !== undefined &&
      profile.targetCriteria?.revenueMax !== undefined &&
      profile.targetCriteria?.ebitdaMin !== undefined &&
      profile.targetCriteria?.ebitdaMax !== undefined &&
      profile.targetCriteria?.transactionSizeMin !== undefined &&
      profile.targetCriteria?.transactionSizeMax !== undefined &&
      profile.targetCriteria?.minStakePercent !== undefined &&
      profile.targetCriteria?.minYearsInBusiness !== undefined &&
      profile.targetCriteria?.preferredBusinessModels?.length > 0 &&
      profile.targetCriteria?.description &&
      profile.agreements?.feeAgreementAccepted
    );
  }

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async handleProfileCompletionReminder() {
    this.logger.log('Running profile completion reminder cron job');

    const now = new Date();
    const twoDaysAgo = new Date(now.getTime() - (2 * 24 * 60 * 60 * 1000));

    const buyers = await this.buyerModel
      .find({
        isEmailVerified: true,
        profileCompletionReminderCount: { $lt: 5 },
        $or: [
          { lastProfileCompletionReminderSentAt: { $eq: null } },
          { lastProfileCompletionReminderSentAt: { $lte: twoDaysAgo } },
        ],
      })
      .populate('companyProfileId')
      .exec();

    for (const buyer of buyers) {
      try {
        if (!buyer.companyProfileId) continue;
        const profile = buyer.companyProfileId as any;

        if (!this.isProfileComplete(profile)) {
          const subject = 'CIM Amplify can not send you deals until you complete your company profile';
          const emailContent = `
            <p>If you have run into any issues please reply to this email with what is happening and we will help to solve the problem.</p>
            <p>If you did not receive a validation email from us please use this link to request a new one: </p>

            ${emailButton('Resend Verification Email', `${getFrontendUrl()}/resend-verification`)}

            <p>Then check your inbox or spam for an email from deals@amp-ven.com</p>

            <p style="color: red;"><b>If you don't plan to complete your profile please reply delete to this email and we will remove your registration.</b></p>

            <p>If you have questions check out our FAQ section at https://cimamplify.com/#FAQs or reply to this email.</p>
          `;

          const emailBody = genericEmailTemplate(subject, getFirstName(buyer.fullName), emailContent);

          await this.mailService.sendEmailWithLogging(
            buyer.email,
            'buyer',
            subject,
            emailBody,
            [ILLUSTRATION_ATTACHMENT],
          );

          buyer.profileCompletionReminderCount += 1;
          buyer.lastProfileCompletionReminderSentAt = now;
          await buyer.save();

          this.logger.log(`Profile completion reminder sent to buyer: ${buyer.email}. Count: ${buyer.profileCompletionReminderCount}`);
        }
      } catch (error) {
        this.logger.error(`Profile reminder failed for buyer ${buyer.email}`, this.formatError(error));
      }
    }
  }

  async testProfileCompletionReminder() {
    this.logger.log('MANUAL TEST: Running profile completion reminder');
    await this.handleProfileCompletionReminder();
  }

  @Cron('*/5 * * * *')
  async testCronIsWorking() {
    this.logger.log(`✓ Cron system is working - ${new Date().toISOString()}`);
  }

  /**
   * Monthly Buyer Report - 1st of every month at 8 AM
   * Rich HTML email with active deals, new pending, and old pending sections.
   */
  @Cron('0 8 1 * *')
  async handleMonthlyBuyerReport() {
    this.logger.log('Running monthly buyer report cron job');
    const buyers = await this.buyerModel.find({ isEmailVerified: true }).exec();
    const frontendUrl = getFrontendUrl();

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    const monthYear = monthStart.toLocaleString('en-US', { month: 'long', year: 'numeric' });
    const generatedDate = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

    const formatCurrency = (amount: number | undefined): string => {
      if (!amount && amount !== 0) return 'N/A';
      if (amount >= 1_000_000_000) return `$${(amount / 1_000_000_000).toFixed(1)}B`;
      if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
      if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
      return `$${amount.toLocaleString()}`;
    };

    const formatDateShort = (d: Date | string | undefined): string => {
      if (!d) return 'N/A';
      return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const daysBetween = (d1: Date, d2: Date): number => {
      return Math.max(0, Math.floor((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)));
    };

    for (const buyer of buyers) {
      try {
        const buyerId = buyer._id.toString();
        const [activeDeals, pendingDeals] = await Promise.all([
          this.dealsService.getBuyerDeals(buyerId, 'active'),
          this.dealsService.getBuyerDeals(buyerId, 'pending'),
        ]);

        // Only send if buyer has at least one active or pending deal
        if (activeDeals.length === 0 && pendingDeals.length === 0) continue;

        const subject = `Your CIM Amplify Monthly Deal Report — ${monthYear}`;

        // Helper to convert deal to report format
        const toDealRow = (deal: any, invitedAt?: Date): BuyerReportDeal => ({
          title: deal.title || 'Untitled Deal',
          location: deal.geographySelection || deal.geography || '-',
          industry: deal.industrySector || '-',
          revenue: formatCurrency(deal.financialDetails?.trailingRevenueAmount),
          ebitda: formatCurrency(deal.financialDetails?.trailingEBITDAAmount),
          dateSince: formatDateShort(invitedAt || deal.createdAt),
          daysWaiting: invitedAt ? daysBetween(invitedAt, now) : daysBetween(new Date(deal.createdAt), now),
          isLoi: deal.status === 'loi',
        });

        // Build active deals with respondedAt as "active since"
        const activeDealRows: BuyerReportDeal[] = activeDeals.map((deal: any) => {
          const invStatus = deal.invitationStatus instanceof Map
            ? deal.invitationStatus.get(buyerId)
            : deal.invitationStatus?.[buyerId];
          return toDealRow(deal, invStatus?.respondedAt ? new Date(invStatus.respondedAt) : undefined);
        });

        // Split pending deals: new this month vs older
        const newPendingRows: BuyerReportDeal[] = [];
        const oldPendingRows: BuyerReportDeal[] = [];
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        for (const deal of pendingDeals) {
          const d = deal as any;
          const invStatus = d.invitationStatus instanceof Map
            ? d.invitationStatus.get(buyerId)
            : d.invitationStatus?.[buyerId];
          const invitedAt = invStatus?.invitedAt ? new Date(invStatus.invitedAt) : new Date(d.createdAt);
          const row = toDealRow(d, invitedAt);

          if (invitedAt >= thirtyDaysAgo) {
            newPendingRows.push(row);
          } else {
            oldPendingRows.push(row);
          }
        }

        // Sort old pending by days waiting descending
        oldPendingRows.sort((a, b) => (b.daysWaiting || 0) - (a.daysWaiting || 0));

        const reportData: BuyerReportData = {
          buyerName: buyer.fullName || 'Buyer',
          buyerCompany: buyer.companyName || '',
          monthYear,
          generatedDate,
          pendingCount: pendingDeals.length,
          newThisMonthCount: newPendingRows.length,
          activeCount: activeDeals.length,
          activeDeals: activeDealRows,
          newPendingDeals: newPendingRows,
          oldPendingDeals: oldPendingRows,
          frontendUrl,
        };

        const emailBody = buyerMonthlyReportTemplate(reportData);
        await this.mailService.sendEmailWithLogging(buyer.email, 'buyer', subject, emailBody, [ILLUSTRATION_ATTACHMENT]);

        this.logger.log(`Monthly buyer report sent to ${buyer.email}: ${activeDeals.length} active, ${pendingDeals.length} pending (${newPendingRows.length} new, ${oldPendingRows.length} old)`);
      } catch (error) {
        this.logger.error(`Monthly buyer report failed for ${buyer.email}`, this.formatError(error));
      }
    }
  }

  /**
   * Monthly Advisor/Seller Report - 1st of every month at 9 AM
   * Rich HTML email with per-deal buyer tables and movement tracking.
   */
  @Cron('0 9 1 * *')
  async handleMonthlySellerReport() {
    this.logger.log('Running monthly seller/advisor report cron job');
    const sellers = await this.sellerModel.find().exec();
    const frontendUrl = getFrontendUrl();

    // Report covers the previous month
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    const monthYear = monthStart.toLocaleString('en-US', { month: 'long', year: 'numeric' });

    const formatDate = (d: Date | string | undefined): string => {
      if (!d) return 'N/A';
      return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const formatCurrency = (amount: number | undefined): string => {
      if (!amount && amount !== 0) return 'N/A';
      if (amount >= 1_000_000_000) return `$${(amount / 1_000_000_000).toFixed(1)}B`;
      if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
      if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
      return `$${amount.toLocaleString()}`;
    };

    // Count new buyers added last month (for no-deals advisors)
    const newBuyersLastMonth = await this.buyerModel.countDocuments({
      createdAt: { $gte: monthStart, $lte: monthEnd },
    }).exec();

    for (const seller of sellers) {
      try {
        const sellerId = seller._id.toString();
        const [activeDeals, loiDeals] = await Promise.all([
          this.dealsService.findBySeller(sellerId) as Promise<DealDocumentType[]>,
          this.dealsService.getSellerLOIDeals(sellerId) as Promise<DealDocumentType[]>,
        ]);

        const allReportDeals = [
          ...activeDeals.map(d => ({ deal: d, status: 'active' as const })),
          ...loiDeals.map(d => ({ deal: d, status: 'loi' as const })),
        ];

        const subject = `Your CIM Amplify Monthly Deal Report — ${monthYear}`;

        let totalBuyerInterest = 0;
        let totalMovements = 0;
        const reportDeals: ReportDeal[] = [];

        for (const { deal, status } of allReportDeals) {
          const invStatusObj = deal.invitationStatus instanceof Map
            ? Object.fromEntries(deal.invitationStatus)
            : (deal.invitationStatus || {});

          // Gather active buyers and passed count
          const activeBuyerEntries: Array<{ buyerId: string; entry: any }> = [];
          let passedCount = 0;

          for (const [buyerId, entry] of Object.entries(invStatusObj)) {
            if (!entry || typeof entry !== 'object') continue;
            const e = entry as any;
            if (e.response === 'accepted') {
              activeBuyerEntries.push({ buyerId, entry: e });
            } else if (e.response === 'rejected') {
              passedCount++;
            }
          }

          totalBuyerInterest += activeBuyerEntries.length;

          // Resolve buyer names for active buyers
          const activeBuyers: ReportBuyer[] = [];
          for (const { buyerId, entry } of activeBuyerEntries) {
            try {
              const buyer = await this.buyerModel.findById(buyerId).select('fullName companyName').lean().exec();
              activeBuyers.push({
                fullName: (buyer as any)?.fullName || 'Unknown Buyer',
                companyName: (buyer as any)?.companyName || '',
                interestedSince: formatDate(entry.respondedAt),
              });
            } catch {
              activeBuyers.push({ fullName: 'Unknown Buyer', companyName: '', interestedSince: formatDate(entry.respondedAt) });
            }
          }

          // Gather movements this month
          const movements: BuyerMovement[] = [];
          for (const [buyerId, entry] of Object.entries(invStatusObj)) {
            if (!entry || typeof entry !== 'object') continue;
            const e = entry as any;
            if (!e.respondedAt) continue;
            const respondedDate = new Date(e.respondedAt);
            if (respondedDate < monthStart || respondedDate > monthEnd) continue;

            // Determine from/to labels
            const prevStatus = e.previousStatus || 'pending';
            const currentResponse = e.response;
            let fromLabel = 'Pending';
            let toLabel = 'Active';

            if (prevStatus === 'accepted' || prevStatus === 'active') fromLabel = 'Active';
            else if (prevStatus === 'pending' || prevStatus === 'requested') fromLabel = 'Pending';

            if (currentResponse === 'accepted') toLabel = 'Active';
            else if (currentResponse === 'rejected') toLabel = 'Passed';

            // Skip if no actual change
            if (fromLabel === toLabel) continue;

            try {
              const buyer = await this.buyerModel.findById(buyerId).select('fullName companyName').lean().exec();
              movements.push({
                buyerName: (buyer as any)?.fullName || 'Unknown Buyer',
                buyerCompany: (buyer as any)?.companyName || '',
                fromStatus: fromLabel,
                toStatus: toLabel,
                date: formatDate(respondedDate),
              });
            } catch {
              movements.push({
                buyerName: 'Unknown Buyer',
                buyerCompany: '',
                fromStatus: fromLabel,
                toStatus: toLabel,
                date: formatDate(respondedDate),
              });
            }
          }

          totalMovements += movements.length;
          const dealId = deal._id instanceof Types.ObjectId ? deal._id.toHexString() : String(deal._id);

          reportDeals.push({
            id: dealId,
            title: deal.title || 'Untitled Deal',
            revenue: formatCurrency((deal as any).financialDetails?.trailingRevenueAmount),
            ebitda: formatCurrency((deal as any).financialDetails?.trailingEBITDAAmount),
            listedDate: formatDate((deal as any).createdAt),
            status,
            activeBuyerCount: activeBuyerEntries.length,
            passedCount,
            activeBuyers,
            movements,
          });
        }

        const reportData: AdvisorReportData = {
          advisorName: seller.fullName || 'Advisor',
          advisorCompany: seller.companyName || '',
          monthYear,
          activeDealsCount: allReportDeals.length,
          totalBuyerInterest,
          movementsThisMonth: totalMovements,
          deals: reportDeals,
          frontendUrl,
          newBuyersLastMonth,
        };

        const emailBody = advisorMonthlyReportTemplate(reportData);
        await this.mailService.sendEmailWithLogging(seller.email, 'seller', subject, emailBody, [ILLUSTRATION_ATTACHMENT]);

        this.logger.log(`Monthly advisor report sent to ${seller.email}: ${activeDeals.length} active, ${loiDeals.length} LOI, ${totalMovements} movements`);
      } catch (error) {
        this.logger.error(`Monthly advisor report failed for ${seller.email}`, this.formatError(error));
      }
    }
  }

  @Cron(CronExpression.EVERY_6_MONTHS)
  async handleSemiAnnualBuyerReminder() {
    this.logger.log('Running semi-annual buyer reminder cron job');
    const buyers = await this.buyerModel.find().exec();

    for (const buyer of buyers) {
      try {
        const subject = 'Please Make Sure Your CIM Amplify Target Criteria is Up to Date';
        const emailContent = `
          <p>Don't miss deals that fit your updated criteria! Head to your member dashboard and click on Company Profile to make sure your information is up to date.</p>
          ${emailButton('Update Your Profile', `${getFrontendUrl()}/buyer/profile`)}
        `;

        const emailBody = genericEmailTemplate(subject, getFirstName(buyer.fullName), emailContent);
        await this.mailService.sendEmailWithLogging(
          buyer.email,
          'buyer',
          subject,
          emailBody,
          [ILLUSTRATION_ATTACHMENT],
        );
      } catch (error) {
        this.logger.error(`Semi-annual reminder failed for buyer ${buyer.email}`, this.formatError(error));
      }
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanUpExpiredVerificationTokens() {
    this.logger.log('Running cron job to clean up expired verification tokens');
    const result = await this.emailVerificationModel.deleteMany({
      expiresAt: { $lt: new Date() },
      isUsed: false,
    }).exec();
    this.logger.log(`Cleaned up ${result.deletedCount} expired and unused verification tokens.`);
  }

  /**
   * 3-Day Introduction Follow-Up
   * Runs daily at 9 AM - checks for introductions sent 3 days ago
   * and sends follow-up emails to both buyer and advisor asking
   * if they have heard from each other.
   */
  @Cron('0 9 * * *')
  async handleIntroductionFollowUp() {
    this.logger.log('Running 3-day introduction follow-up cron job');

    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - (3 * 24 * 60 * 60 * 1000));
    const fourDaysAgo = new Date(now.getTime() - (4 * 24 * 60 * 60 * 1000));

    // Find deals with accepted invitations from ~3 days ago that haven't been followed up
    const deals = await this.dealModel.find({
      status: { $nin: ['completed'] },
    }).exec();

    let followUpsSent = 0;

    for (const deal of deals) {
      const invitationStatusObj = deal.invitationStatus instanceof Map
        ? Object.fromEntries(deal.invitationStatus)
        : (deal.invitationStatus || {});

      for (const [buyerId, statusRaw] of Object.entries(invitationStatusObj)) {
        if (!statusRaw || typeof statusRaw !== 'object') continue;
        const status = statusRaw as any;
        if (status.response !== 'accepted') continue;
        if (!status.respondedAt) continue;
        if (status.introFollowUpSentAt) continue; // Already sent

        const respondedAt = new Date(status.respondedAt);
        // Only process if responded between 3-4 days ago
        if (respondedAt > threeDaysAgo || respondedAt < fourDaysAgo) continue;

        try {
          const seller = await this.sellerModel.findById(deal.seller).exec();
          const buyer = await this.buyerModel.findById(buyerId).exec();

          if (!seller || !buyer) continue;

          const dealTitle = deal.title || 'Untitled Deal';

          // Email to Advisor: Did you hear from the buyer?
          const advisorSubject = `Follow Up: Have you heard from ${buyer.fullName} regarding ${dealTitle}?`;
          const advisorContent = `
            <p>Three days ago we introduced you to <strong>${buyer.fullName}</strong> from <strong>${buyer.companyName}</strong> regarding <strong>${dealTitle}</strong>.</p>
            <p style="font-size: 15px; font-weight: 600; margin: 20px 0 10px;">Have you heard from this buyer?</p>
            <table cellpadding="0" cellspacing="0" style="margin: 0 0 20px;">
              <tr>
                <td style="padding-right: 12px;">
                  ${emailButton('Yes, we connected', `${getFrontendUrl()}/seller/dashboard`)}
                </td>
                <td>
                  <a href="mailto:deals@amp-ven.com?subject=${encodeURIComponent(`No response from buyer: ${buyer.fullName} - ${dealTitle}`)}&body=${encodeURIComponent(`Hi CIM Amplify Team,\n\nI have not heard from ${buyer.fullName} at ${buyer.companyName} regarding ${dealTitle}.\n\nPlease help follow up.\n\nThank you`)}" style="display: inline-block; padding: 10px 24px; background-color: #ef4444; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">No, I haven't heard back</a>
                </td>
              </tr>
            </table>
            <p style="font-size: 13px; color: #666;">If you haven't heard from the buyer, click "No" and our team will follow up with them on your behalf.</p>
            <p>Buyer contact details:</p>
            <p style="margin: 12px 0; padding: 12px; background-color: #f5f5f5; border-radius: 8px;">
              <strong>${buyer.fullName}</strong><br>
              ${buyer.companyName}<br>
              <a href="mailto:${buyer.email}" style="color: #3aafa9;">${buyer.email}</a><br>
              ${buyer.phone || ''}
            </p>
          `;

          const advisorEmailBody = genericEmailTemplate(advisorSubject, getFirstName(seller.fullName), advisorContent);
          await this.mailService.sendEmailWithLogging(
            seller.email,
            'seller',
            advisorSubject,
            advisorEmailBody,
            [ILLUSTRATION_ATTACHMENT],
            (deal._id instanceof Types.ObjectId) ? deal._id.toHexString() : String(deal._id),
          );

          // Email to Buyer: Did you hear from the advisor?
          const buyerSubject = `Follow Up: Have you heard from ${seller.fullName} regarding ${dealTitle}?`;
          const buyerContent = `
            <p>Three days ago you accepted an introduction to <strong>${dealTitle}</strong> and we connected you with the advisor, <strong>${seller.fullName}</strong> from <strong>${seller.companyName}</strong>.</p>
            <p style="font-size: 15px; font-weight: 600; margin: 20px 0 10px;">Have you heard from this advisor?</p>
            <table cellpadding="0" cellspacing="0" style="margin: 0 0 20px;">
              <tr>
                <td style="padding-right: 12px;">
                  ${emailButton('Yes, we connected', `${getFrontendUrl()}/buyer/deals`)}
                </td>
                <td>
                  <a href="mailto:deals@amp-ven.com?subject=${encodeURIComponent(`No response from advisor: ${seller.fullName} - ${dealTitle}`)}&body=${encodeURIComponent(`Hi CIM Amplify Team,\n\nI have not heard from ${seller.fullName} at ${seller.companyName} regarding ${dealTitle}.\n\nPlease help follow up.\n\nThank you`)}" style="display: inline-block; padding: 10px 24px; background-color: #ef4444; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">No, I haven't heard back</a>
                </td>
              </tr>
            </table>
            <p style="font-size: 13px; color: #666;">If you haven't heard from the advisor, click "No" and our team will follow up with them on your behalf.</p>
            <p>Advisor contact details:</p>
            <p style="margin: 12px 0; padding: 12px; background-color: #f5f5f5; border-radius: 8px;">
              <strong>${seller.fullName}</strong><br>
              ${seller.companyName}<br>
              <a href="mailto:${seller.email}" style="color: #3aafa9;">${seller.email}</a>
            </p>
          `;

          const buyerEmailBody = genericEmailTemplate(buyerSubject, getFirstName(buyer.fullName), buyerContent);
          await this.mailService.sendEmailWithLogging(
            buyer.email,
            'buyer',
            buyerSubject,
            buyerEmailBody,
            [ILLUSTRATION_ATTACHMENT],
            (deal._id instanceof Types.ObjectId) ? deal._id.toHexString() : String(deal._id),
          );

          // Mark follow-up as sent
          if (deal.invitationStatus instanceof Map) {
            const entry = deal.invitationStatus.get(buyerId);
            if (entry) {
              entry.introFollowUpSentAt = now;
              deal.invitationStatus.set(buyerId, entry);
            }
          }
          deal.markModified('invitationStatus');
          await deal.save();

          followUpsSent++;
          this.logger.log(`Introduction follow-up sent for deal "${dealTitle}" - buyer: ${buyer.email}, advisor: ${seller.email}`);
        } catch (error) {
          this.logger.error(`Introduction follow-up failed for deal ${deal._id}, buyer ${buyerId}`, this.formatError(error));
        }
      }
    }

    this.logger.log(`Introduction follow-up cron complete. ${followUpsSent} follow-ups sent.`);
  }
}
