// Set RESEND_API_KEY and RESEND_FROM in Railway environment variables.
// RESEND_FROM example: "Huwelijkscursus <noreply@jouwdomein.nl>"
// The from-domain must be verified in your Resend dashboard.

export async function sendEmail({ to, subject, html }: {
  to: string
  subject: string
  html: string
}): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) { console.error('RESEND_API_KEY not set'); return false }

  const from = process.env.RESEND_FROM ?? 'Huwelijkscursus <noreply@huwelijkscursus.nl>'

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to, subject, html }),
  })

  if (!res.ok) {
    const err = await res.text().catch(() => '')
    console.error('Resend error:', res.status, err)
  }
  return res.ok
}
