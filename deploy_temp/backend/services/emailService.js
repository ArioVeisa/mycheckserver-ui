import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

export const sendEmail = async (to, subject, html) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('Email service not configured. Skipping email:', { to, subject });
    return false;
  }

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'MyCheckServer <noreply@mycheckserver.com>',
      to,
      subject,
      html
    });
    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
};

export const sendVerificationEmail = async (email, token) => {
  const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
  
  return sendEmail(email, 'Verifikasi Email - MyCheckServer', `
    <h2>Verifikasi Email Anda</h2>
    <p>Terima kasih telah mendaftar di MyCheckServer!</p>
    <p>Klik link berikut untuk memverifikasi email Anda:</p>
    <a href="${verifyUrl}" style="display: inline-block; padding: 12px 24px; background: #6366f1; color: white; text-decoration: none; border-radius: 8px;">
      Verifikasi Email
    </a>
    <p>Atau copy link berikut: ${verifyUrl}</p>
    <p>Link ini berlaku selama 24 jam.</p>
  `);
};
