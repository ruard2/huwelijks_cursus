import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateToken, hashToken } from '@/lib/auth'
import { sendEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  const { code, name } = await req.json()
  if (!code?.trim() || !name?.trim()) {
    return NextResponse.json({ error: 'Code en naam zijn verplicht' }, { status: 400 })
  }

  const couple = await prisma.couple.findUnique({
    where: { code: code.trim().toUpperCase() },
    include: { members: true },
  })

  if (!couple?.email) {
    return NextResponse.json({ error: 'Geen e-mailadres gekoppeld aan deze koppelcode. Neem contact op met de beheerder.' }, { status: 404 })
  }

  const member = couple.members.find(
    (m: { name: string }) => m.name.toLowerCase() === name.trim().toLowerCase()
  )
  if (!member) {
    return NextResponse.json({ error: 'Naam niet gevonden bij deze koppelcode' }, { status: 404 })
  }

  const token = generateToken()
  const expiry = new Date(Date.now() + 15 * 60 * 1000) // 15 minuten

  await prisma.couple.update({
    where: { id: couple.id },
    data: { recoveryToken: hashToken(token), tokenExpiry: expiry },
  })

  await sendEmail({
    to: couple.email,
    subject: 'PIN resetten — Huwelijkscursus',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
        <h1 style="font-size: 20px; font-weight: bold; color: #1c1917; margin-bottom: 8px;">PIN resetten</h1>
        <p style="color: #57534e; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">
          Hoi ${member.name}, gebruik de onderstaande code om een nieuwe PIN in te stellen. De code is <strong>15 minuten</strong> geldig.
        </p>
        <div style="background: #f5f5f4; border-radius: 16px; padding: 20px; text-align: center; margin-bottom: 24px;">
          <p style="font-family: monospace; font-size: 40px; font-weight: bold; letter-spacing: 8px; color: #1c1917; margin: 0;">${token}</p>
        </div>
        <p style="color: #78716c; font-size: 13px;">
          Heb jij dit niet aangevraagd? Dan kun je dit e-mail negeren.
        </p>
      </div>
    `,
  })

  return NextResponse.json({ ok: true, email: couple.email.replace(/(.{2}).+(@.+)/, '$1***$2') })
}
