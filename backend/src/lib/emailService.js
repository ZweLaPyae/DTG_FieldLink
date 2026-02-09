import nodemailer from 'nodemailer';

/**
 * Email service for sending emails using SMTP
 * Configure your email provider in .env file
 */

// Create reusable transporter
let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  // Check if email is configured
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    console.warn('⚠️  Email service not configured. Set SMTP credentials in .env file.');
    return null;
  }

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return transporter;
}

/**
 * Send welcome email to new technician with login credentials
 * @param {Object} params - Email parameters
 * @param {string} params.to - Recipient email
 * @param {string} params.name - Technician name
 * @param {string} params.password - Generated password
 * @param {string} params.email - Technician email (for login)
 */
export async function sendTechnicianWelcomeEmail({ to, name, password, email }) {
  const transport = getTransporter();
  
  if (!transport) {
    console.log('📧 Email not sent - service not configured');
    return { success: false, message: 'Email service not configured' };
  }

  const mailOptions = {
    from: `"DTG FieldLink" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    to,
    subject: 'Welcome to DTG FieldLink - Your Account Details',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
          .credentials { background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb; }
          .credentials-label { font-weight: bold; color: #6b7280; margin-bottom: 5px; }
          .credentials-value { font-size: 18px; color: #1f2937; font-family: monospace; background-color: #f3f4f6; padding: 8px 12px; border-radius: 4px; display: inline-block; }
          .warning { background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }
          .warning-title { font-weight: bold; color: #92400e; margin-bottom: 5px; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
          .button { display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to DTG FieldLink!</h1>
          </div>
          <div class="content">
            <p>Hi <strong>${name}</strong>,</p>
            
            <p>Your technician account has been created successfully. You can now access the DTG FieldLink mobile application.</p>
            
            <div class="credentials">
              <div class="credentials-label">Email / Username:</div>
              <div class="credentials-value">${email}</div>
              
              <div class="credentials-label" style="margin-top: 15px;">Password:</div>
              <div class="credentials-value">${password}</div>
            </div>
            
            <div class="warning">
              <div class="warning-title">🔒 Security Note</div>
              <p style="margin: 5px 0 0 0;">Please change your password after your first login. Keep your credentials secure and do not share them with anyone.</p>
            </div>
            
            <p><strong>Next Steps:</strong></p>
            <ol>
              <li>Download the DTG FieldLink mobile app</li>
              <li>Sign in using the credentials above</li>
              <li>Complete your profile setup</li>
              <li>Start managing your assigned tickets</li>
            </ol>
            
            <p>If you have any questions or need assistance, please contact your administrator.</p>
            
            <p>Best regards,<br><strong>DTG FieldLink Team</strong></p>
          </div>
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>&copy; ${new Date().getFullYear()} DTG FieldLink. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Welcome to DTG FieldLink!

Hi ${name},

Your technician account has been created successfully.

Login Credentials:
------------------
Email: ${email}
Password: ${password}

IMPORTANT: Please change your password after your first login.

Next Steps:
1. Download the DTG FieldLink mobile app
2. Sign in using the credentials above
3. Complete your profile setup
4. Start managing your assigned tickets

If you have any questions, please contact your administrator.

Best regards,
DTG FieldLink Team
    `.trim(),
  };

  try {
    const info = await transport.sendMail(mailOptions);
    console.log(`✅ Welcome email sent to ${to}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Failed to send email to ${to}:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Test email configuration
 */
export async function testEmailConfig() {
  const transport = getTransporter();
  
  if (!transport) {
    return { success: false, message: 'Email service not configured' };
  }

  try {
    await transport.verify();
    console.log('✅ Email server is ready to send messages');
    return { success: true, message: 'Email configuration is valid' };
  } catch (error) {
    console.error('❌ Email configuration error:', error.message);
    return { success: false, error: error.message };
  }
}
