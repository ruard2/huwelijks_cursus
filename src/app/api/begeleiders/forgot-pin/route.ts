import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateToken, hashToken } from '@/lib/auth'
import { sendEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  const { email } = await req.json()
  if (!email?.trim()) {
    return NextResponse.json({ error: 'E-mailadres is verplicht' }, { status: 400 })
  }

  const beg = await prisma.begeleider.findFirst({
    where: { email: email.trim().toLowerCase(), emailVerified: true },
  })

  if (!beg) return NextResponse.json({ ok: true })

  const token = generateToken()
  const expiry = new Date(Date.now() + 15 * 60 * 1000)

  await prisma.begeleider.update({
    where: { id: beg.id },
    data: { emailToken: hashToken(token), tokenExpiry: expiry },
  })

  await sendEmail({
    to: beg.email!,
    subject: 'PIN resetten — Huwelijkscursus begeleider',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
        <h1 style="font-size: 20px; font-weight: bold; color: #1c1917; margin-bottom: 8px;">PIN resetten</h1>
        <p style="color: #57534e; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">
          Hoi ${beg.name}, gebruik de onderstaande code om een nieuwe PIN in te stellen. De code is <strong>15 minuten</strong> geldig.
        </p>
        <div style="background: #f5f5f4; border-radius: 16px; padding: 20px; text-align: center; margin-bottom: 24px;">
          <p style="font-family: monospace; font-size: 40px; font-weight: bold; letter-spacing: 8px; color: #1c1917; margin: 0;">${token}</p>
        </div>
        <p style="color: #78716c; font-size: 13px;">Heb jij dit niet aangevraagd? Dan kun je dit e-mail negeren.</p>
      </div>
    `,
  })

  return NextResponse.json({ ok: true })
}
