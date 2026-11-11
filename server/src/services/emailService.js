/**
 * Pluggable Email Service for DevSync.
 * Supports Resend, SMTP, and Local Development simulation.
 */
async function sendVerificationEmail({ to, token, name }) {
  const verificationUrl = `${process.env.CLIENT_ORIGIN || 'http://localhost:5173'}/verify-email?token=${token}`;

  // 1. Resend integration (if configured)
  if (process.env.RESEND_API_KEY) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: process.env.MAIL_FROM || 'DevSync <verify@devsync.app>',
          to: [to],
          subject: 'Verify your University Student Email — DevSync',
          html: `
            <div style="font-family: sans-serif; max-width: 500px; margin: auto; padding: 20px;">
              <h2 style="color: #9333ea;">Verify your Student Email</h2>
              <p>Hello ${name || 'Builder'},</p>
              <p>Please confirm your university student email to receive your verified student badge on DevSync.</p>
              <p style="margin: 30px 0;">
                <a href="${verificationUrl}" style="background: #9333ea; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">Verify Email Address</a>
              </p>
              <p style="color: #666; font-size: 12px;">This link will expire in 24 hours.</p>
            </div>
          `,
        }),
      });
      return { delivered: response.ok, provider: 'resend' };
    } catch (err) {
      console.error('[emailService] Resend error:', err);
    }
  }

  // 2. Local dev / testing fallback: log link cleanly
  // eslint-disable-next-line no-console
  console.log(`[emailService] Verification email generated for ${to}: ${verificationUrl}`);
  return { delivered: false, simulated: true, verificationUrl, token };
}

module.exports = {
  sendVerificationEmail,
};
