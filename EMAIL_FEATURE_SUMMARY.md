# Admin Email Sending Feature - Implementation Summary

## Overview
Added a comprehensive email management feature that allows admins to send custom emails to users through the admin panel. All emails are sent using the existing CIM Amplify email template design.

## Features Implemented

### 1. Backend (NestJS)
- **New Endpoint**: `POST /mail/admin/send-custom-email`
- **Authentication**: Protected with JWT and Admin role guard
- **Recipient Types Supported**:
  - Single user (by email)
  - All users (buyers, sellers, admins, members)
  - All buyers
  - All sellers
  - All admins
  - All team members

### 2. Frontend (Next.js)
- **New Page**: `/admin/emails/send`
- **Features**:
  - Dropdown to select recipient type
  - Email input for single recipient
  - Subject and body fields
  - HTML support in body
  - Automatic wrapping in CIM Amplify email template
  - Success/error notifications
  - Link from main emails page

## Files Modified/Created

### Backend
1. `backend/src/mail/mail.controller.ts` - Added sendCustomEmail endpoint
2. `backend/src/mail/mail.service.ts` - Added sendCustomEmail method with user fetching logic
3. `backend/src/mail/mail.module.ts` - Added Buyer, Seller, Admin, TeamMember schemas

### Frontend
1. `frontend/app/admin/emails/send/page.tsx` - New email composition page
2. `frontend/app/admin/emails/page.tsx` - Added "Send Email" button

## How It Works

1. Admin navigates to `/admin/emails` and clicks "Send Email"
2. Admin selects recipient type from dropdown
3. If single user, admin enters email address
4. Admin writes subject and body (supports HTML)
5. On submit, the body is wrapped in `genericEmailTemplate()`
6. Backend fetches recipients based on type
7. Emails are sent using `sendEmailWithLogging()` which:
   - Sends via nodemailer
   - Logs to CommunicationLog
   - Queues for retry on failure
8. Response shows success count

## Email Template
All emails use the existing `genericEmailTemplate()` from `generic-email.template.ts` which includes:
- CIM Amplify logo
- Branded header
- Professional styling
- Footer with company info

## Error Handling
- Validation for required fields
- Authentication checks
- Individual email failures don't stop batch sends
- Failed emails are logged and queued for retry
- User-friendly error messages

## Usage Example

**Send to single user:**
```
Recipient Type: Single User
Email: john@example.com
Subject: Welcome to CIM Amplify
Body: <p>Hello! We're excited to have you.</p>
```

**Send to all buyers:**
```
Recipient Type: All Buyers
Subject: New Deal Opportunities
Body: <p>Check out the latest deals on your dashboard.</p>
```

## Security
- Admin-only access (JWT + Role guard)
- Email validation
- Rate limiting via nodemailer pool
- Logging of all sent emails
