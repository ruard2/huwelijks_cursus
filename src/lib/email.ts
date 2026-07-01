import nodemailer from 'nodemailer'

// Transip SMTP — set these in Railway environment variables:
//   SMTP_HOST  = smtp.transip.email
//   SMTP_PORT  = 587
//   SMTP_USER  = admin@huwelijkscursus.online
//   SMTP_PASS  = <e-mailwachtwoord>
//   SMTP_FROM  = Huwelijkscursus <admin@huwelijkscursus.online>

export async function sendEmail({ to, subject, html }: {
  to: string
  subject: string
  html: string
}): Promise<boolean> {
  const host = process.env.SMTP_HOST
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  if (!host || !user || !pass) {
    console.error('SMTP_HOST / SMTP_USER / SMTP_PASS not set')
    return false
  }

  const port = parseInt(process.env.SMTP_PORT ?? '587', 10)
  const from = process.env.SMTP_FROM ?? `Huwelijkscursus <${user}>`

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  })

  try {
    await transporter.sendMail({ from, to, subject, html })
    return true
  } catch (err) {
    console.error('SMTP error:', err)
    return false
  }
}
