import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateLinkToken } from '@/lib/auth'
import { sendEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  const { name, email, partnerCode, begeleiderName } = await req.json()
  if (!name?.trim()) return NextResponse.json({ error: 'Naam is verplicht' }, { status: 400 })
  if (!email?.trim()) return NextResponse.json({ error: 'E-mailadres is verplicht' }, { status: 400 })

  const cleanCode = partnerCode?.trim().toUpperCase() || null
  if (cleanCode) {
    const couple = await prisma.couple.findUnique({ where: { code: cleanCode } })
    if (!couple) return NextResponse.json({ error: 'Koppelcode niet gevonden' }, { status: 404 })
  }

  const token = generateLinkToken()
  const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000)

  await prisma.pendingRegistration.upsert({
    where: { email: email.trim().toLowerCase() },
    create: {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      partnerCode: cleanCode,
      begeleiderName: begeleiderName?.trim() || null,
      token,
      tokenExpiry,
    },
    update: {
      name: name.trim(),
      partnerCode: cleanCode,
      begeleiderName: begeleiderName?.trim() || null,
      token,
      tokenExpiry,
    },
  })

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://www.huwelijkscursus.online'
  const link = `${baseUrl}/verify?token=${token}`

  sendEmail({
    to: email.trim(),
    subject: 'Bevestig je registratie — Huwelijkscursus',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
        <h1 style="font-size: 22px; font-weight: bold; color: #1c1917; margin-bottom: 8px;">Welkom bij de Huwelijkscursus!</h1>
        <p style="color: #57534e; font-size: 15px; line-height: 1.6; margin-bottom: 28px;">
          Hoi ${name.trim()}, klik op de knop hieronder om je e-mailadres te bevestigen en direct in te loggen.
        </p>
        <div style="text-align: center; margin-bottom: 28px;">
          <a href="${link}" style="background: #1c1917; color: white; text-decoration: none; padding: 16px 36px; border-radius: 14px; font-weight: bold; font-size: 16px; display: inline-block;">
            Bevestigen en inloggen →
          </a>
        </div>
        <p style="color: #78716c; font-size: 13px; line-height: 1.6;">
          Deze link is 24 uur geldig. Heb jij dit niet aangevraagd? Dan kun je dit e-mail negeren.
        </p>
        <p style="color: #a8a29e; font-size: 12px; margin-top: 16px;">
          Werkt de knop niet? Kopieer deze link:<br>
          <a href="${link}" style="color: #78716c; word-break: break-all;">${link}</a>
        </p>
      </div>
    `,
  })

  return NextResponse.json({ ok: true })
}
