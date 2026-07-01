import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateSalt, hashPin, generateToken, hashToken } from '@/lib/auth'
import { sendEmail } from '@/lib/email'

const WORDS = [
  'TROUW', 'LIEFDE', 'HOOP', 'VREDE', 'GENADE', 'ZEGEN', 'TROTS', 'VERBOND',
  'GELOOF', 'ANKER', 'HAVEN', 'THUIS', 'SAMEN', 'VREUGDE', 'STEUN', 'LICHT',
  'ROTS', 'BRON', 'ECHT', 'BAND', 'HART', 'RUST', 'DANK', 'GROEI',
]

function generateCode(): string {
  const word = WORDS[Math.floor(Math.random() * WORDS.length)]
  const num = String(Math.floor(1000 + Math.random() * 9000))
  return `${word}-${num}`
}

export async function POST(req: NextRequest) {
  const { name, email, pin } = await req.json()
  if (!name?.trim()) {
    return NextResponse.json({ error: 'Naam is verplicht' }, { status: 400 })
  }

  let code = generateCode()
  let attempts = 0
  while (attempts < 10) {
    const exists = await prisma.couple.findUnique({ where: { code } })
    if (!exists) break
    code = generateCode()
    attempts++
  }

  const pinSalt = pin?.trim() ? generateSalt() : undefined
  const pinHash = pin?.trim() && pinSalt ? hashPin(pin.trim(), pinSalt) : undefined

  const cleanEmail = email?.trim() || null
  let verificationToken: string | undefined
  let tokenExpiry: Date | undefined

  if (cleanEmail) {
    verificationToken = generateToken()
    tokenExpiry = new Date(Date.now() + 30 * 60 * 1000) // 30 min
  }

  const couple = await prisma.couple.create({
    data: {
      code,
      email: cleanEmail,
      recoveryToken: verificationToken ? hashToken(verificationToken) : undefined,
      tokenExpiry: tokenExpiry,
    },
  })
  const member = await prisma.member.create({
    data: { coupleId: couple.id, name: name.trim(), pinHash, pinSalt },
  })

  if (cleanEmail && verificationToken) {
    sendEmail({
      to: cleanEmail,
      subject: 'Bevestig je e-mailadres — Huwelijkscursus',
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
          <h1 style="font-size: 20px; font-weight: bold; color: #1c1917; margin-bottom: 8px;">Welkom bij de Huwelijkscursus!</h1>
          <p style="color: #57534e; font-size: 15px; line-height: 1.6; margin-bottom: 8px;">
            Jouw koppelcode is: <strong style="font-family: monospace; font-size: 18px; letter-spacing: 2px;">${code}</strong>
          </p>
          <p style="color: #57534e; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">
            Bevestig je e-mailadres met de onderstaande code zodat je later je koppelcode of PIN kunt herstellen. De code is <strong>30 minuten</strong> geldig.
          </p>
          <div style="background: #f5f5f4; border-radius: 16px; padding: 20px; text-align: center; margin-bottom: 24px;">
            <p style="font-family: monospace; font-size: 40px; font-weight: bold; letter-spacing: 8px; color: #1c1917; margin: 0;">${verificationToken}</p>
          </div>
          <p style="color: #78716c; font-size: 13px;">Heb jij dit niet aangevraagd? Dan kun je dit e-mail negeren.</p>
        </div>
      `,
    })
  }

  return NextResponse.json({
    coupleId: couple.id,
    coupleCode: couple.code,
    memberId: member.id,
    memberName: member.name,
    hasPin: !!pinHash,
    emailSent: !!cleanEmail,
  })
}
