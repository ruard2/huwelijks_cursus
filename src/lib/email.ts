export async function sendEmail({ to, subject, html }: {
  to: string
  subject: string
  html: string
}): Promise<boolean> {
  const apiKey = process.env.BREVO_API_KEY ?? process.env.SMTP_PASS
  const fromRaw = process.env.SMTP_FROM ?? 'Huwelijkscursus <admin@huwelijkscursus.online>'

  if (!apiKey) {
    console.error('BREVO_API_KEY not set')
    return false
  }

  // Parse "Name <email>" or just "email"
  const match = fromRaw.match(/^(.+?)\s*<(.+?)>$/)
  const senderName = match ? match[1].trim() : 'Huwelijkscursus'
  const senderEmail = match ? match[2].trim() : fromRaw.trim()

  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({
        sender: { name: senderName, email: senderEmail },
        to: [{ email: to }],
        subject,
        htmlContent: html,
      }),
    })
    if (!res.ok) {
      const err = await res.text()
      console.error('Brevo API error:', res.status, err)
      return false
    }
    return true
  } catch (err) {
    console.error('Brevo fetch error:', err)
    return false
  }
}
