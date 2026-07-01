import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateToken, hashToken } from '@/lib/auth'
import { sendEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  const { name, email } = await req.json()
  if (!name?.trim() || !email?.trim()) {
    return NextResponse.json({ error: 'Naam en e-mailadres zijn verplicht' }, { status: 400 })
  }
  const cleanName = name.trim()
  const cleanEmail = email.trim().toLowerCase()

  const existing = await prisma.begeleider.findUnique({ where: { name: cleanName } })
  if (existing?.emailVerified) {
    return NextResponse.json({ error: 'Deze naam is al geregistreerd. Gebruik inloggen of PIN herstellen.' }, { status: 409 })
  }

  const emailUsed = await prisma.begeleider.findFirst({
    where: { email: cleanEmail, emailVerified: true, name: { not: cleanName } },
  })
  if (emailUsed) {
    return NextResponse.json({ error: 'Dit e-mailadres is al in gebruik.' }, { status: 409 })
  }

  const token = generateToken()
  const expiry = new Date(Date.now() + 15 * 60 * 1000)

  await prisma.begeleider.upsert({
    where: { name: cleanName },
    create: { name: cleanName, email: cleanEmail, emailToken: hashToken(token), tokenExpiry: expiry },
    update: { email: cleanEmail, emailToken: hashToken(token), tokenExpiry: expiry },
  })

  await sendEmail({
    to: cleanEmail,
    subject: 'Verificatiecode — Huwelijkscursus begeleider',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
        <h1 style="font-size: 20px; font-weight: bold; color: #1c1917; margin-bottom: 8px;">Welkom, ${cleanName}</h1>
        <p style="color: #57534e; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">
          Gebruik de onderstaande code om je e-mailadres te bevestigen. De code is <strong>15 minuten</strong> geldig.
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
