# Email Configuration Guide

This guide explains how to set up email sending for technician invitations.

## Quick Setup

Add these environment variables to your `.env` file in the `backend` folder:

```env
# Email Configuration (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=DTG FieldLink <your-email@gmail.com>
```

## Email Provider Setup

### Option 1: Gmail (Recommended for Development)

1. **Enable 2-Factor Authentication** on your Google Account
2. **Generate App Password**:
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (Custom name)"
   - Copy the 16-character password
3. **Update .env**:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-16-char-app-password
   SMTP_FROM=DTG FieldLink <your-email@gmail.com>
   ```

### Option 2: Outlook/Office 365

```env
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
SMTP_FROM=DTG FieldLink <your-email@outlook.com>
```

### Option 3: SendGrid (Production)

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
SMTP_FROM=noreply@yourdomain.com
```

### Option 4: AWS SES (Production)

```env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-aws-smtp-username
SMTP_PASS=your-aws-smtp-password
SMTP_FROM=noreply@yourdomain.com
```

## Testing Email Configuration

1. **Install nodemailer** (if not already installed):
   ```bash
   cd backend
   npm install nodemailer
   ```

2. **Create a test script** `backend/test-email.js`:
   ```javascript
   import { testEmailConfig, sendTechnicianWelcomeEmail } from './src/lib/emailService.js';
   import 'dotenv/config';

   async function test() {
     console.log('Testing email configuration...\n');
     
     // Test connection
     const result = await testEmailConfig();
     console.log(result);
     
     if (result.success) {
       // Send test email
       const testResult = await sendTechnicianWelcomeEmail({
         to: 'test@example.com', // Change to your email
         name: 'Test Technician',
         password: 'DTG1234',
         email: 'test@example.com',
       });
       console.log('\nTest email result:', testResult);
     }
   }

   test();
   ```

3. **Run the test**:
   ```bash
   node test-email.js
   ```

## What Happens When You Invite a Technician

1. **Technician is created** in the database
2. **Firebase Auth user** is created
3. **Welcome email is sent** with:
   - Login credentials (email & generated password)
   - Instructions for first login
   - Security reminder to change password
4. **Admin sees confirmation** whether email was sent successfully

## Email Template

The welcome email includes:
- Professional HTML design
- Login credentials clearly displayed
- Security warnings
- Next steps instructions
- Mobile app download reminder

## Troubleshooting

### Email not sending?

1. **Check .env file** - Make sure all SMTP variables are set
2. **Verify credentials** - Try logging into your email provider
3. **Check firewall** - Port 587 should be open
4. **Gmail users** - Must use App Password, not regular password
5. **Check logs** - Backend console shows email sending status

### Email goes to spam?

For production:
- Use a professional domain (not Gmail)
- Set up SPF, DKIM, and DMARC records
- Use a transactional email service (SendGrid, AWS SES)
- Verify your sender domain

## Fallback Behavior

If email is **not configured** or **fails to send**:
- Technician is still created successfully
- Admin sees the password in the success dialog
- Admin can manually share the password
- No errors are thrown

## Security Notes

⚠️ **Important**:
- Never commit `.env` file to version control
- Use App Passwords for Gmail (never your main password)
- For production, use dedicated email services (SendGrid, AWS SES)
- Rotate SMTP passwords regularly
- Monitor email sending logs

## Cost Considerations

- **Gmail**: Free (500 emails/day limit)
- **SendGrid**: Free tier: 100 emails/day
- **AWS SES**: $0.10 per 1,000 emails (very cheap)
- **Mailgun**: Free tier: 5,000 emails/month

For production with high volume, we recommend AWS SES or SendGrid.
