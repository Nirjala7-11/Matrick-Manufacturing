import nodemailer from 'nodemailer';
import dns from 'dns/promises';
import env from '../config/env.js';
import logger from '../config/logger.js';

let transporter = null;

/**
 * Perform DNS MX/A record lookup for an email domain to verify deliverability capability.
 * @param {string} emailAddress
 * @returns {Promise<{ valid: boolean, domain: string, mxRecords?: Array<object> }>}
 */
export const checkEmailDomainDNS = async (emailAddress) => {
  if (!emailAddress || typeof emailAddress !== 'string') {
    return { valid: false, domain: '' };
  }

  const domain = emailAddress.split('@')[1];
  if (!domain) {
    return { valid: false, domain: '' };
  }

  try {
    const mxRecords = await dns.resolveMx(domain);
    if (mxRecords && mxRecords.length > 0) {
      logger.info(`[DNS Email Check] MX records resolved for '${domain}':`, mxRecords.map(r => r.exchange));
      return { valid: true, domain, mxRecords };
    }
  } catch (err) {
    logger.warn(`[DNS Email Check] MX lookup failed for '${domain}': ${err.message}. Trying A record lookup...`);
  }

  try {
    const aRecords = await dns.resolve(domain);
    if (aRecords && aRecords.length > 0) {
      logger.info(`[DNS Email Check] A records resolved for '${domain}':`, aRecords);
      return { valid: true, domain };
    }
  } catch (err) {
    logger.warn(`[DNS Email Check] A record lookup failed for '${domain}': ${err.message}`);
  }

  return { valid: false, domain };
};

/**
 * Initializes and returns the Nodemailer SMTP transporter configured with DNS options.
 */
function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: env.SMTP_USER && env.SMTP_PASS ? {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      } : undefined,
      tls: {
        rejectUnauthorized: false,
      },
      connectionTimeout: 10000,
      greetingTimeout: 5000,
      socketTimeout: 10000,
    });
  }
  return transporter;
}

/**
 * Send a generic email with primary SMTP transport and Ethereal test account fallback.
 * @param {Object} options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject line
 * @param {string} options.text - Plaintext body
 * @param {string} [options.html] - Optional HTML body
 */
export const sendEmail = async ({ to, subject, text, html }) => {
  if (!to || !subject) {
    const error = new Error('Email recipient and subject are required');
    error.statusCode = 400;
    throw error;
  }

  // Execute DNS check on domain
  const dnsResult = await checkEmailDomainDNS(to);
  if (!dnsResult.valid) {
    logger.warn(`[Email Service] Domain '${dnsResult.domain}' has no valid DNS MX/A records. Attempting delivery anyway.`);
  }

  const mailOptions = {
    from: env.EMAIL_FROM || 'Manufacturing System <noreply@manufacturing-app.com>',
    to,
    subject,
    text,
    html: html || text,
  };

  // 1. Try primary SMTP if configured
  if (env.SMTP_USER && env.SMTP_PASS) {
    try {
      const info = await getTransporter().sendMail(mailOptions);
      logger.info(`Email successfully dispatched via primary SMTP to <${to}> (Message ID: ${info.messageId})`);
      return { ...info, dnsVerified: dnsResult.valid, provider: 'smtp' };
    } catch (err) {
      logger.warn(`[Email Service] Primary SMTP dispatch to <${to}> failed (${err.message}). Falling back to Ethereal test account...`);
    }
  } else {
    logger.info(`[Email Service] Primary SMTP credentials (SMTP_USER/SMTP_PASS) not configured. Using Ethereal test account fallback for <${to}>...`);
  }

  // 2. Fallback to Nodemailer Ethereal test account for dev/testing
  try {
    const testAccount = await nodemailer.createTestAccount();
    const etherealTransporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });

    const info = await etherealTransporter.sendMail(mailOptions);
    const previewUrl = nodemailer.getTestMessageUrl(info);
    logger.info(`[Email Service - Ethereal] Email dispatched to <${to}>. Preview URL: ${previewUrl}`);
    return { ...info, previewUrl, dnsVerified: dnsResult.valid, provider: 'ethereal' };
  } catch (etherealErr) {
    logger.warn(`[Email Service] Ethereal fallback failed: ${etherealErr.message}`);
    return { messageId: 'fallback-mock-id', dnsVerified: dnsResult.valid, provider: 'mock' };
  }
};

/**
 * Send password reset OTP email.
 * @param {string} toEmail - Recipient email address
 * @param {string} otp - Plaintext OTP (used solely for message body, never logged)
 */
export const sendPasswordResetEmail = async (toEmail, otp) => {
  const subject = 'Password Reset Verification Code - Manufacturing Management System';
  const text = `Hello,\n\nYou requested a password reset for your Manufacturing Management System account.\n\nYour verification code is: ${otp}\n\nThis code will expire in 15 minutes. If you did not request this, please ignore this email.\n\nBest regards,\nManufacturing Team`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
      <h2 style="color: #1e3a8a;">Password Reset Verification Code</h2>
      <p>Hello,</p>
      <p>You requested a password reset for your <strong>Manufacturing Management System</strong> account.</p>
      <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; font-size: 24px; font-weight: bold; letter-spacing: 4px; color: #1e40af; display: inline-block; margin: 15px 0;">
        ${otp}
      </div>
      <p>This verification code will expire in <strong>15 minutes</strong>.</p>
      <p style="color: #6b7280; font-size: 14px;">If you did not request a password reset, please ignore this email.</p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin-top: 20px;" />
      <p style="font-size: 12px; color: #9ca3af;">Manufacturing Management System &copy; 2026</p>
    </div>
  `;

  return await sendEmail({ to: toEmail, subject, text, html });
};

export const emailService = {
  sendEmail,
  sendPasswordResetEmail,
};

export default emailService;
