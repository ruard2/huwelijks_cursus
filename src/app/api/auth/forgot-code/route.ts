import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  const { email } = await req.json()
  if (!email?.trim()) return NextResponse.json({ error: 'E-mailadres verplicht' }, { status: 400 })

  const couple = await prisma.couple.findFirst({
    where: { email: email.trim().toLowerCase() },
    include: { members: true },
  })

  // Always return success to prevent email enumeration
  if (!couple) return NextResponse.json({ ok: true })

  const names = couple.members.map((m: { name: string }) => m.name).join(' en ')

  await sendEmail({
    to: email.trim(),
    subject: 'Jouw koppelcode — Huwelijkscursus',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
        <h1 style="font-size: 20px; font-weight: bold; color: #1c1917; margin-bottom: 8px;">Koppelcode gevonden</h1>
        <p style="color: #57534e; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">
          Hoi ${names},<br/>hier is jouw koppelcode voor de Huwelijkscursus:
        </p>
        <div style="background: #f5f5f4; border-radius: 16px; padding: 20px; text-align: center; margin-bottom: 24px;">
          <p style="font-family: monospace; font-size: 28px; font-weight: bold; letter-spacing: 4px; color: #1c1917; margin: 0;">${couple.code}</p>
        </div>
        <p style="color: #78716c; font-size: 13px; line-height: 1.6;">
          Bewaar deze code op een veilige plek. Je hebt hem nodig bij het inloggen op een nieuw apparaat.
        </p>
      </div>
    `,
  })

  return NextResponse.json({ ok: true })
}
