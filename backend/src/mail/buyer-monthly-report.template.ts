/**
 * Buyer Monthly Report Email Template
 * Generates a rich HTML email matching the CIM Amplify buyer report design.
 * All styles are inlined for email-client compatibility.
 */

export interface BuyerReportDeal {
  dealId: string;
  activateUrl?: string;
  passUrl?: string;
  title: string;
  location: string;
  industry: string;
  revenue: string;   // formatted e.g. "$14.2M"
  ebitda: string;
  dateSince: string;  // formatted date for active, or days count for pending
  daysWaiting?: number;
  isLoi: boolean;
}

export interface BuyerReportData {
  buyerName: string;
  buyerCompany: string;
  monthYear: string;        // "March 2026"
  generatedDate: string;    // "March 27, 2026"
  pendingCount: number;
  newThisMonthCount: number;
  activeCount: number;
  activeDeals: BuyerReportDeal[];
  newPendingDeals: BuyerReportDeal[];   // pending, added this month
  oldPendingDeals: BuyerReportDeal[];   // pending, older than 30 days
  frontendUrl: string;
}

const C = {
  navy: '#17252A',
  tealPrimary: '#2B7A78',
  tealSecondary: '#3AAFA9',
  tealLight: '#DEF2F1',
  white: '#ffffff',
  textDark: '#1a1a1a',
  textMuted: '#888',
  border: '#e0e0dc',
  borderLight: '#e8e8e4',
  bgBody: '#f4f4f2',
  bgRow: '#f8f8f6',
  activeBg: 'rgba(43,122,120,0.04)',
  loiPillBg: '#FAECE7',
  loiPillText: '#993C1D',
  urgencyBg: 'rgba(186,117,23,0.08)',
  urgencyBorder: 'rgba(186,117,23,0.4)',
  urgencyBold: '#854F0B',
  ageFresh: '#0F6E56',
  ageWarm: '#854F0B',
  ageOld: '#993C1D',
  badgeNewBg: '#DEF2F1',
  badgeNewText: '#0F6E56',
};

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function ageColor(days: number | undefined): string {
  if (!days || days <= 14) return C.ageFresh;
  if (days <= 30) return C.ageWarm;
  return C.ageOld;
}

function ageLabel(days: number | undefined): string {
  if (!days) return 'New';
  return `${days} day${days !== 1 ? 's' : ''}`;
}

function loiPill(): string {
  return `<span style="display:inline-block;font-size:10px;font-weight:500;background:${C.loiPillBg};color:${C.loiPillText};padding:2px 7px;border-radius:20px;margin-left:4px;">LOI</span>`;
}

function renderActiveDealsTable(deals: BuyerReportDeal[], frontendUrl: string): string {
  if (deals.length === 0) return '';

  const rows = deals.map(d => {
    const rowBg = d.isLoi ? 'rgba(240,153,123,0.05)' : C.activeBg;
    const activateUrl = d.activateUrl || `${frontendUrl}/buyer/deals?dealId=${encodeURIComponent(d.dealId)}&action=activate`;
    const passUrl = d.passUrl || `${frontendUrl}/buyer/deals?dealId=${encodeURIComponent(d.dealId)}&action=pass`;

    const actionCell = d.isLoi
      ? `<td style="padding:10px 10px;border-bottom:0.5px solid ${C.borderLight};background:${rowBg};font-size:11px;color:${C.loiPillText};font-style:italic;text-align:right;">Under LOI</td>`
      : `<td style="padding:10px 10px;border-bottom:0.5px solid ${C.borderLight};background:${rowBg};text-align:right;">
          <a href="${passUrl}" target="_blank" style="font-size:11px;font-weight:500;color:#666;border:0.5px solid #ccc;border-radius:6px;padding:5px 10px;text-decoration:none;display:inline-block;">Pass</a>
        </td>`;

    return `<tr>
      <td style="padding:10px 10px;border-bottom:0.5px solid ${C.borderLight};background:${rowBg};vertical-align:middle;">
        <div style="font-weight:500;font-size:13px;color:${C.textDark};">${esc(d.title)}${d.isLoi ? ` ${loiPill()}` : ''}</div>
        <div style="font-size:11px;color:${C.textMuted};margin-top:2px;">${esc(d.location)}</div>
      </td>
      <td style="padding:10px 10px;border-bottom:0.5px solid ${C.borderLight};background:${rowBg};color:${C.textMuted};font-size:12px;">${esc(d.industry)}</td>
      <td style="padding:10px 10px;border-bottom:0.5px solid ${C.borderLight};background:${rowBg};font-size:12px;">${esc(d.revenue)}</td>
      <td style="padding:10px 10px;border-bottom:0.5px solid ${C.borderLight};background:${rowBg};font-size:12px;">${esc(d.ebitda)}</td>
      <td style="padding:10px 10px;border-bottom:0.5px solid ${C.borderLight};background:${rowBg};font-size:11px;color:${C.textMuted};">${esc(d.dateSince)}</td>
      ${actionCell}
    </tr>`;
  }).join('');

  return `
    <div style="margin-top:24px;">
      <table style="width:100%;"><tr>
        <td><span style="font-size:13px;font-weight:500;color:${C.textDark};">Active deals &mdash; you've expressed interest</span></td>
        <td style="text-align:right;"><span style="font-size:11px;color:${C.textMuted};">${deals.length} active</span></td>
      </tr></table>
      <div style="height:8px;border-bottom:0.5px solid ${C.border};margin-bottom:10px;"></div>
      <table style="width:100%;border-collapse:collapse;font-size:13px;">
        <thead>
          <tr style="background:${C.bgRow};">
            <th style="font-size:11px;font-weight:500;color:${C.textMuted};text-align:left;padding:6px 10px;border-top:0.5px solid ${C.border};border-bottom:0.5px solid ${C.border};">Deal</th>
            <th style="font-size:11px;font-weight:500;color:${C.textMuted};text-align:left;padding:6px 10px;border-top:0.5px solid ${C.border};border-bottom:0.5px solid ${C.border};">Industry</th>
            <th style="font-size:11px;font-weight:500;color:${C.textMuted};text-align:left;padding:6px 10px;border-top:0.5px solid ${C.border};border-bottom:0.5px solid ${C.border};">Revenue</th>
            <th style="font-size:11px;font-weight:500;color:${C.textMuted};text-align:left;padding:6px 10px;border-top:0.5px solid ${C.border};border-bottom:0.5px solid ${C.border};">EBITDA</th>
            <th style="font-size:11px;font-weight:500;color:${C.textMuted};text-align:left;padding:6px 10px;border-top:0.5px solid ${C.border};border-bottom:0.5px solid ${C.border};">Active since</th>
            <th style="font-size:11px;font-weight:500;color:${C.textMuted};text-align:right;padding:6px 10px;border-top:0.5px solid ${C.border};border-bottom:0.5px solid ${C.border};">Action</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

function renderPendingDealsTable(
  deals: BuyerReportDeal[],
  frontendUrl: string,
  sectionTitle: string,
  badgeHtml: string,
  countHtml: string,
  showUrgencyBar: boolean,
): string {
  if (deals.length === 0) return '';

  const rows = deals.map(d => {
    const rowBg = d.isLoi ? 'rgba(240,153,123,0.03)' : C.white;
    const ageClr = ageColor(d.daysWaiting);
    const activateUrl = d.activateUrl || `${frontendUrl}/buyer/deals?dealId=${encodeURIComponent(d.dealId)}&action=activate`;
    const passUrl = d.passUrl || `${frontendUrl}/buyer/deals?dealId=${encodeURIComponent(d.dealId)}&action=pass`;

    const actionCell = d.isLoi
      ? `<td style="padding:10px 10px;border-bottom:0.5px solid ${C.borderLight};background:${rowBg};font-size:11px;color:${C.loiPillText};font-style:italic;text-align:right;">Under LOI</td>`
      : `<td style="padding:10px 10px;border-bottom:0.5px solid ${C.borderLight};background:${rowBg};text-align:right;">
          <a href="${activateUrl}" target="_blank" style="font-size:11px;font-weight:500;background:${C.tealPrimary};color:#fff;border:none;border-radius:6px;padding:5px 10px;text-decoration:none;display:inline-block;margin-right:4px;">Active</a>
          <a href="${passUrl}" target="_blank" style="font-size:11px;font-weight:500;color:#666;border:0.5px solid #ccc;border-radius:6px;padding:5px 10px;text-decoration:none;display:inline-block;">Pass</a>
        </td>`;

    return `<tr>
      <td style="padding:10px 10px;border-bottom:0.5px solid ${C.borderLight};background:${rowBg};vertical-align:middle;">
        <div style="font-weight:500;font-size:13px;color:${C.textDark};">${esc(d.title)}${d.isLoi ? ` ${loiPill()}` : ''}</div>
        <div style="font-size:11px;color:${C.textMuted};margin-top:2px;">${esc(d.location)}</div>
      </td>
      <td style="padding:10px 10px;border-bottom:0.5px solid ${C.borderLight};background:${rowBg};color:${C.textMuted};font-size:12px;">${esc(d.industry)}</td>
      <td style="padding:10px 10px;border-bottom:0.5px solid ${C.borderLight};background:${rowBg};font-size:12px;">${esc(d.revenue)}</td>
      <td style="padding:10px 10px;border-bottom:0.5px solid ${C.borderLight};background:${rowBg};font-size:12px;">${esc(d.ebitda)}</td>
      <td style="padding:10px 10px;border-bottom:0.5px solid ${C.borderLight};background:${rowBg};"><span style="font-size:11px;color:${ageClr};font-weight:500;">${ageLabel(d.daysWaiting)}</span></td>
      ${actionCell}
    </tr>`;
  }).join('');

  const urgencyBar = showUrgencyBar ? `
    <div style="background:${C.urgencyBg};border:0.5px solid ${C.urgencyBorder};border-radius:8px;padding:12px 16px;margin-bottom:10px;">
      <table style="width:100%;"><tr>
        <td style="width:24px;vertical-align:top;font-size:15px;padding-right:10px;">&#9888;</td>
        <td style="font-size:13px;color:#333;line-height:1.6;">
          These pending deals weren&rsquo;t blasted to everyone &mdash; <strong style="font-weight:500;color:${C.urgencyBold};">advisors hand-picked you based on your acquisition criteria.</strong> Leaving an invitation unanswered signals disinterest, and advisors take note. When the next great deal comes in, the buyers who engage get invited.
        </td>
      </tr></table>
    </div>
  ` : '';

  return `
    <div style="margin-top:24px;">
      <table style="width:100%;"><tr>
        <td><span style="font-size:13px;font-weight:500;color:${C.textDark};">${esc(sectionTitle)}</span> ${badgeHtml}</td>
        <td style="text-align:right;">${countHtml}</td>
      </tr></table>
      <div style="height:8px;border-bottom:0.5px solid ${C.border};margin-bottom:10px;"></div>
      ${urgencyBar}
      <table style="width:100%;border-collapse:collapse;font-size:13px;">
        <thead>
          <tr style="background:${C.bgRow};">
            <th style="font-size:11px;font-weight:500;color:${C.textMuted};text-align:left;padding:6px 10px;border-top:0.5px solid ${C.border};border-bottom:0.5px solid ${C.border};">Deal</th>
            <th style="font-size:11px;font-weight:500;color:${C.textMuted};text-align:left;padding:6px 10px;border-top:0.5px solid ${C.border};border-bottom:0.5px solid ${C.border};">Industry</th>
            <th style="font-size:11px;font-weight:500;color:${C.textMuted};text-align:left;padding:6px 10px;border-top:0.5px solid ${C.border};border-bottom:0.5px solid ${C.border};">Revenue</th>
            <th style="font-size:11px;font-weight:500;color:${C.textMuted};text-align:left;padding:6px 10px;border-top:0.5px solid ${C.border};border-bottom:0.5px solid ${C.border};">EBITDA</th>
            <th style="font-size:11px;font-weight:500;color:${C.textMuted};text-align:left;padding:6px 10px;border-top:0.5px solid ${C.border};border-bottom:0.5px solid ${C.border};">Waiting for You</th>
            <th style="font-size:11px;font-weight:500;color:${C.textMuted};text-align:right;padding:6px 10px;border-top:0.5px solid ${C.border};border-bottom:0.5px solid ${C.border};">Actions</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

export function buyerMonthlyReportTemplate(data: BuyerReportData): string {
  const activeSection = renderActiveDealsTable(data.activeDeals, data.frontendUrl);

  const newPendingSection = renderPendingDealsTable(
    data.newPendingDeals,
    data.frontendUrl,
    'New this month — pending review',
    `<span style="font-size:10px;font-weight:500;background:${C.badgeNewBg};color:${C.badgeNewText};padding:2px 8px;border-radius:20px;margin-left:8px;">${data.newThisMonthCount} new</span>`,
    `<span style="font-size:11px;color:${C.textMuted};">Added this month</span>`,
    false,
  );

  const oldPendingSection = renderPendingDealsTable(
    data.oldPendingDeals,
    data.frontendUrl,
    'Pending deals older than one month',
    '',
    `<span style="font-size:11px;font-weight:500;color:${C.loiPillText};">${data.oldPendingDeals.length} deal${data.oldPendingDeals.length !== 1 ? 's' : ''} &middot; sorted by time waiting</span>`,
    true,
  );

  const hasNoDeals = data.activeDeals.length === 0 && data.newPendingDeals.length === 0 && data.oldPendingDeals.length === 0;

  const htmlContent = `
    <p style="font-size:13px;color:${C.textMuted};margin-bottom:4px;">${esc(data.buyerCompany)} &middot; ${esc(data.monthYear)} &middot; Generated ${esc(data.generatedDate)}</p>

    <!-- Stats -->
    <table style="width:100%;border-collapse:separate;border-spacing:10px 0;margin:16px 0;">
      <tr>
        <td style="width:50%;background:${C.navy};border-radius:8px;padding:12px 14px;">
          <div style="font-size:11px;color:${C.tealSecondary};text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">Pending deals</div>
          <div style="font-size:24px;font-weight:500;color:${C.tealLight};">${data.pendingCount}</div>
          <div style="font-size:11px;color:rgba(222,242,241,0.5);margin-top:2px;">+${data.newThisMonthCount} new this month</div>
        </td>
        <td style="width:50%;background:${C.navy};border-radius:8px;padding:12px 14px;">
          <div style="font-size:11px;color:${C.tealSecondary};text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">Active (interested)</div>
          <div style="font-size:24px;font-weight:500;color:${C.tealLight};">${data.activeCount}</div>
          <div style="font-size:11px;color:rgba(222,242,241,0.5);margin-top:2px;">In progress</div>
        </td>
      </tr>
    </table>

    ${activeSection}
    ${newPendingSection}
    ${oldPendingSection}

    ${hasNoDeals ? `
      <div style="margin-top:24px;padding:20px;background:#f9fafb;border-radius:8px;border:1px solid #e5e7eb;text-align:center;">
        <p style="margin:0;color:#6b7280;font-size:14px;">No deals to display this month.</p>
        <p style="margin:8px 0 0;color:#6b7280;font-size:13px;">We'll send you deals as soon as they match your criteria. Make sure your profile is up to date!</p>
      </div>
    ` : ''}

    <!-- Footer Note -->
    <div style="margin-top:24px;padding:12px 16px;background:${C.bgRow};border-radius:8px;font-size:12px;color:#666;line-height:1.6;border-left:2px solid ${C.tealPrimary};">
      If you move a deal to Active and find you&rsquo;re already looking at it from another source, just reply to this email or click Pass &mdash; no hassle. Your criteria can be updated any time by logging into your dashboard.
    </div>

    <!-- Login CTA -->
    <div style="margin-top:16px;text-align:center;padding:16px;border:0.5px dashed #ccc;border-radius:10px;">
      <div><a href="${data.frontendUrl}/buyer/deals" style="display:inline-block;font-size:13px;font-weight:500;background:${C.tealPrimary};color:#fff;padding:10px 28px;border-radius:6px;text-decoration:none;">Log in to your buyer dashboard</a></div>
      <div style="font-size:11px;color:${C.textMuted};margin-top:6px;">${esc(data.frontendUrl)}/buyer/deals</div>
    </div>
  `;

  const { genericEmailTemplate } = require('./generic-email.template');
  return genericEmailTemplate(
    'Your Monthly Deal Activity Report',
    data.buyerName.split(' ')[0] || data.buyerName,
    htmlContent,
  );
}
