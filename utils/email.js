// utils/email.js
import nodemailer from "nodemailer";

/**
 * Create a singleton transporter.
 * Uses process.env.EMAIL_USERNAME and process.env.EMAIL_PASSWORD
 * (for Gmail you might need an App Password or OAuth2).
 */
let transporter;

function getTransporter() {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    service: "gmail", // change if using another provider
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
    // If you use a non-standard SMTP host, use:
    // host: process.env.SMTP_HOST,
    // port: Number(process.env.SMTP_PORT) || 587,
    // secure: false,
  });

  // Optional: verify connection on startup (helps surface auth errors early)
  transporter.verify().catch((err) => {
    // Don't crash the app; log so you can fix envs
    // In production, consider more robust logging
    console.warn("Email transporter verification failed:", err.message || err);
  });

  return transporter;
}

/**
 * sendEmail - reusable function
 * @param {Object} opts
 * @param {String|String[]} opts.to - recipient(s)
 * @param {String} opts.subject
 * @param {String} [opts.text]
 * @param {String} [opts.html]
 * @param {Array} [opts.attachments] - nodemailer attachments array
 * @returns {Promise<Object>} info from nodemailer
 */
export async function sendEmail({
  to,
  subject,
  text = "",
  html = "",
  attachments = [],
}) {
  if (!process.env.EMAIL_USERNAME || !process.env.EMAIL_PASSWORD) {
    throw new Error("Email credentials not set in environment variables.");
  }

  const mailOptions = {
    from: `"No-Reply" <${process.env.EMAIL_USERNAME}>`,
    to,
    subject,
    text,
    html,
    attachments,
  };

  const t = getTransporter();
  return t.sendMail(mailOptions);
}
