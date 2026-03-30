/**
 * Advisor Monthly Report Email Template
 * Generates a rich HTML email matching the CIM Amplify design.
 * All styles are inlined for email-client compatibility.
 */

export interface ReportBuyer {
  fullName: string;
  companyName: string;
  interestedSince: string; // formatted date
}

export interface BuyerMovement {
  buyerName: string;
  buyerCompany: string;
  fromStatus: string; // "Pending" | "Active"
  toStatus: string;   // "Active" | "Passed"
  date: string;       // formatted date
}

export interface ReportDeal {
  id: string;
  title: string;
  revenue: string;  // formatted, e.g. "$30M"
  ebitda: string;
  listedDate: string;
  status: 'active' | 'loi';
  activeBuyerCount: number;
  passedCount: number;
  activeBuyers: ReportBuyer[];
  movements: BuyerMovement[];
}

export interface AdvisorReportData {
  advisorName: string;
  advisorCompany: string;
  monthYear: string;       // e.g. "March 2026"
  activeDealsCount: number;
  totalBuyerInterest: number;
  movementsThisMonth: number;
  deals: ReportDeal[];
  frontendUrl: string;
}

// Colors (inlined since emails don't support CSS vars)
const C = {
  navy: '#17252A',
  tealPrimary: '#2B7A78',
  tealSecondary: '#3AAFA9',
  tealLight: '#DEF2F1',
  tealPale: '#f0faf9',
  white: '#FEFFFF',
  border: '#d4ecea',
  textPrimary: '#17252A',
  textSecondary: '#3d6065',
  textMuted: '#7ba5a8',
  activeBg: '#e8f9f8',
  activeText: '#0f5a58',
  passedText: '#999',
  loiBg: '#fff3cd',
  loiText: '#7a4f00',
  flagBg: '#fff3f0',
  flagBorder: '#f0b8ac',
  flagText: '#a02808',
};

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function statusPill(label: string, type: 'from' | 'active' | 'passed' | 'loi'): string {
  const styles: Record<string, string> = {
    from: `background:#f0f0f0;color:#666;`,
    active: `background:${C.activeBg};color:${C.activeText};`,
    passed: `background:#f5f5f5;color:#666;`,
    loi: `background:${C.loiBg};color:${C.loiText};`,
  };
  return `<span style="display:inline-block;padding:2px 9px;border-radius:4px;font-size:11px;font-weight:500;${styles[type]}">${escapeHtml(label)}</span>`;
}

function renderBuyersTable(buyers: ReportBuyer[], dealId: string, frontendUrl: string): string {
  if (buyers.length === 0) {
    return `<div style="padding:16px 20px;font-size:13px;color:${C.textMuted};text-align:center;">No active buyers</div>`;
  }
  const rows = buyers.map(b => `
    <tr style="border-bottom:1px solid #f0f7f6;">
      <td style="padding:10px 16px;font-size:13px;color:${C.textPrimary};vertical-align:middle;">
        <span style="font-weight:500;color:${C.navy};display:block;font-size:13px;">${escapeHtml(b.fullName)}</span>
        <span style="font-size:11px;color:${C.textMuted};display:block;">${escapeHtml(b.companyName)}</span>
      </td>
      <td style="padding:10px 16px;font-size:13px;color:${C.textPrimary};vertical-align:middle;">${escapeHtml(b.interestedSince)}</td>
      <td style="padding:10px 16px;text-align:right;vertical-align:middle;">
        <a href="${frontendUrl}/seller/dashboard" style="display:inline-block;padding:6px 14px;border-radius:6px;font-size:12px;font-weight:600;background:${C.flagBg};border:1.5px solid ${C.flagBorder};color:${C.flagText};text-decoration:none;white-space:nowrap;">This Buyer is not Active</a>
      </td>
    </tr>
  `).join('');

  return `
    <div style="padding:11px 20px 9px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.12em;color:${C.textMuted};background:#fafcfc;border-bottom:1px solid ${C.border};">Active Buyers</div>
    <table style="width:100%;border-collapse:collapse;">
      <thead>
        <tr style="background:#f7fafa;border-bottom:1px solid ${C.border};">
          <th style="padding:8px 16px;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;color:${C.textMuted};text-align:left;">Buyer</th>
          <th style="padding:8px 16px;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;color:${C.textMuted};text-align:left;">Interested Since</th>
          <th style="padding:8px 16px;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;color:${C.textMuted};text-align:right;"></th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function renderMovementsTable(movements: BuyerMovement[], monthYear: string): string {
  if (movements.length === 0) return '';

  const rows = movements.map(m => {
    const fromType = m.fromStatus === 'Active' ? 'active' : 'from';
    const toType = m.toStatus === 'Active' ? 'active' : m.toStatus === 'Passed' ? 'passed' : 'loi';
    return `
      <tr style="border-bottom:1px solid #f0f7f6;">
        <td style="padding:10px 16px;font-size:13px;color:${C.textPrimary};vertical-align:middle;">
          <span style="font-weight:500;color:${C.navy};display:block;font-size:13px;">${escapeHtml(m.buyerName)}</span>
          <span style="font-size:11px;color:${C.textMuted};display:block;">${escapeHtml(m.buyerCompany)}</span>
        </td>
        <td style="padding:10px 16px;vertical-align:middle;">
          ${statusPill(m.fromStatus, fromType)}
          <span style="color:#bbb;margin:0 4px;">&rarr;</span>
          ${statusPill(m.toStatus, toType)}
        </td>
        <td style="padding:10px 16px;font-size:12px;color:${C.textMuted};white-space:nowrap;vertical-align:middle;">${escapeHtml(m.date)}</td>
      </tr>
    `;
  }).join('');

  return `
    <div style="padding:11px 20px 9px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.12em;color:${C.textMuted};background:#fafcfc;border-top:1px solid ${C.border};border-bottom:1px solid ${C.border};">Buyer Movements &mdash; ${escapeHtml(monthYear)}</div>
    <table style="width:100%;border-collapse:collapse;">
      <thead>
        <tr style="background:#f2f8f7;border-bottom:1px solid ${C.border};">
          <th style="padding:8px 16px;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;color:${C.textMuted};text-align:left;">Buyer</th>
          <th style="padding:8px 16px;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;color:${C.textMuted};text-align:left;">Movement</th>
          <th style="padding:8px 16px;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;color:${C.textMuted};text-align:left;">Date</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function renderDealCard(deal: ReportDeal, monthYear: string, frontendUrl: string): string {
  const isLoi = deal.status === 'loi';
  const badgeStyle = isLoi
    ? `background:${C.loiBg};color:${C.loiText};`
    : `background:${C.activeBg};color:${C.activeText};`;
  const badgeLabel = isLoi ? 'Under LOI' : 'Active Listing';

  const loiBtnStyle = isLoi
    ? `opacity:0.5;cursor:default;background:${C.loiBg};border:1px solid #e8c84e;color:${C.loiText};`
    : `background:${C.loiBg};border:1px solid #e8c84e;color:${C.loiText};`;
  const loiBtnLabel = isLoi ? 'Currently Under LOI' : 'Mark as Under LOI';

  return `
    <div style="margin:0 36px 28px;background:${C.white};border-radius:12px;border:1px solid ${C.border};overflow:hidden;">
      <!-- Deal Header -->
      <div style="background:${C.tealPale};border-bottom:1px solid ${C.border};padding:16px 20px;">
        <table style="width:100%;">
          <tr>
            <td style="vertical-align:top;">
              <div style="font-family:'Georgia',serif;font-size:16px;color:${C.navy};line-height:1.3;margin-bottom:6px;">${escapeHtml(deal.title)}</div>
              <div style="font-size:12px;color:${C.textSecondary};">
                Revenue: <strong style="color:${C.textPrimary};">${escapeHtml(deal.revenue)}</strong>
                &nbsp;&nbsp;EBITDA: <strong style="color:${C.textPrimary};">${escapeHtml(deal.ebitda)}</strong>
                &nbsp;&nbsp;Listed: <strong style="color:${C.textPrimary};">${escapeHtml(deal.listedDate)}</strong>
              </div>
            </td>
            <td style="vertical-align:top;text-align:right;white-space:nowrap;">
              <span style="display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:20px;font-size:11px;font-weight:600;letter-spacing:0.04em;${badgeStyle}">
                <span style="width:6px;height:6px;border-radius:50%;background:currentColor;display:inline-block;"></span>
                ${badgeLabel}
              </span>
            </td>
          </tr>
        </table>
      </div>

      <!-- Stats Row -->
      <table style="width:100%;border-collapse:collapse;border-bottom:1px solid ${C.border};">
        <tr>
          <td style="width:50%;padding:14px 20px;border-right:1px solid ${C.border};">
            <div style="font-family:'Georgia',serif;font-size:30px;line-height:1;margin-bottom:3px;color:${C.activeText};">${deal.activeBuyerCount}</div>
            <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.1em;font-weight:500;color:${C.activeText};">Active Buyers</div>
          </td>
          <td style="width:50%;padding:14px 20px;">
            <div style="font-family:'Georgia',serif;font-size:30px;line-height:1;margin-bottom:3px;color:${C.passedText};">${deal.passedCount}</div>
            <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.1em;font-weight:500;color:${C.passedText};">Passed</div>
          </td>
        </tr>
      </table>

      <!-- CTA Buttons -->
      <div style="padding:12px 20px;display:flex;gap:10px;background:#fafefe;border-bottom:1px solid ${C.border};">
        <a href="${frontendUrl}/seller/dashboard" style="display:inline-block;padding:8px 16px;border-radius:6px;font-size:12px;font-weight:600;text-decoration:none;${loiBtnStyle}">${loiBtnLabel}</a>
        <a href="${frontendUrl}/seller/dashboard" style="display:inline-block;padding:8px 16px;border-radius:6px;font-size:12px;font-weight:600;text-decoration:none;background:#f5f5f5;border:1px solid #ccc;color:#444;">Mark as Off Market</a>
      </div>

      <!-- Active Buyers Table -->
      ${renderBuyersTable(deal.activeBuyers, deal.id, frontendUrl)}

      <!-- Buyer Movements -->
      ${renderMovementsTable(deal.movements, monthYear)}
    </div>
  `;
}

export function advisorMonthlyReportTemplate(data: AdvisorReportData): string {
  const dealCards = data.deals.map(d => renderDealCard(d, data.monthYear, data.frontendUrl)).join('');
  const dealCount = data.deals.length;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>CIM Amplify — Advisor Monthly Activity Report</title>
</head>
<body style="margin:0;padding:0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;background:#f2f6f6;color:${C.textPrimary};font-size:14px;line-height:1.6;">

<div style="max-width:960px;margin:0 auto;padding:0 0 60px;">

  <!-- HEADER -->
  <div style="background:${C.navy};padding:28px 36px 24px;">
    <table style="width:100%;">
      <tr>
        <td style="vertical-align:top;">
          <table><tr>
            <td style="vertical-align:middle;padding-right:14px;">
              <div style="width:38px;height:38px;background:${C.tealSecondary};border-radius:8px;text-align:center;line-height:38px;font-family:'Georgia',serif;font-size:20px;color:#fff;">C</div>
            </td>
            <td style="vertical-align:middle;">
              <div style="font-size:11px;font-weight:500;letter-spacing:0.12em;text-transform:uppercase;color:${C.tealSecondary};margin-bottom:2px;">CIM Amplify</div>
              <div style="font-family:'Georgia',serif;font-size:22px;color:#fff;line-height:1.2;">Monthly Deal Report</div>
            </td>
          </tr></table>
        </td>
        <td style="vertical-align:top;text-align:right;">
          <div style="font-size:13px;font-weight:500;color:${C.tealLight};margin-bottom:3px;">${escapeHtml(data.monthYear)}</div>
          <div style="font-size:15px;font-weight:600;color:#fff;margin-bottom:2px;">${escapeHtml(data.advisorName)}</div>
          <div style="font-size:12px;color:${C.tealSecondary};margin-bottom:10px;">${escapeHtml(data.advisorCompany)}</div>
          <a href="${data.frontendUrl}/seller/seller-form" style="display:inline-block;padding:9px 18px;border-radius:6px;font-size:12px;font-weight:600;background:${C.tealSecondary};color:#fff;text-decoration:none;letter-spacing:0.02em;">+ Add a New Deal</a>
        </td>
      </tr>
    </table>
  </div>

  <!-- SUMMARY STRIP -->
  <div style="background:${C.tealPrimary};padding:16px 36px;">
    <table style="width:100%;">
      <tr>
        <td style="text-align:center;border-right:1px solid rgba(255,255,255,0.18);width:33%;">
          <div style="font-family:'Georgia',serif;font-size:28px;color:#fff;line-height:1;">${data.activeDealsCount}</div>
          <div style="font-size:11px;color:${C.tealLight};margin-top:3px;text-transform:uppercase;letter-spacing:0.1em;">Active Deals</div>
        </td>
        <td style="text-align:center;border-right:1px solid rgba(255,255,255,0.18);width:34%;">
          <div style="font-family:'Georgia',serif;font-size:28px;color:#fff;line-height:1;">${data.totalBuyerInterest}</div>
          <div style="font-size:11px;color:${C.tealLight};margin-top:3px;text-transform:uppercase;letter-spacing:0.1em;">Buyer Interest</div>
        </td>
        <td style="text-align:center;width:33%;">
          <div style="font-family:'Georgia',serif;font-size:28px;color:#fff;line-height:1;">${data.movementsThisMonth}</div>
          <div style="font-size:11px;color:${C.tealLight};margin-top:3px;text-transform:uppercase;letter-spacing:0.1em;">Movements This Month</div>
        </td>
      </tr>
    </table>
  </div>

  <!-- SECTION HEADING -->
  <div style="padding:28px 36px 12px;">
    <table style="width:100%;"><tr>
      <td><span style="font-family:'Georgia',serif;font-size:18px;color:${C.navy};">Your Active Listings</span></td>
      <td style="text-align:right;"><span style="font-size:12px;color:${C.tealPrimary};font-weight:500;background:${C.tealPale};border:1px solid ${C.border};border-radius:20px;padding:3px 12px;">${dealCount} deal${dealCount !== 1 ? 's' : ''}</span></td>
    </tr></table>
  </div>

  <!-- DEAL CARDS -->
  ${dealCards}

  ${dealCount === 0 ? `
    <div style="margin:0 36px 28px;padding:24px;background:${C.white};border-radius:12px;border:1px solid ${C.border};text-align:center;">
      <p style="margin:0;color:#6b7280;font-size:14px;">You don't have any active deals right now.</p>
      <p style="margin:12px 0 16px;color:#6b7280;font-size:13px;">CIM Amplify buyers are incredibly active. Add your deals to find a great buyer!</p>
      <a href="${data.frontendUrl}/seller/seller-form" style="display:inline-block;padding:10px 24px;border-radius:6px;font-size:13px;font-weight:600;background:${C.tealSecondary};color:#fff;text-decoration:none;">Add Your Deals</a>
    </div>
  ` : ''}

  <!-- FOOTER -->
  <div style="margin:32px 36px 0;padding-top:20px;border-top:1px solid ${C.border};">
    <table style="width:100%;"><tr>
      <td style="font-size:12px;color:${C.textMuted};"><strong style="color:${C.tealPrimary};">CIM Amplify</strong> &middot; Monthly Advisor Report &middot; Amplify Ventures Inc.</td>
      <td style="text-align:right;">
        <a href="${data.frontendUrl}/seller/dashboard" style="font-size:12px;color:${C.tealPrimary};text-decoration:none;font-weight:500;margin-right:16px;">Advisor Dashboard</a>
        <a href="mailto:johnm@cimamplify.com" style="font-size:12px;color:${C.tealPrimary};text-decoration:none;font-weight:500;">Contact Support</a>
      </td>
    </tr></table>
  </div>

</div>

</body>
</html>`;
}
