import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateSalt, hashPin, hashToken } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const { email, token, newPin } = await req.json()
  if (!email?.trim() || !token?.trim() || !newPin?.trim()) {
    return NextResponse.json({ error: 'Alle velden zijn verplicht' }, { status: 400 })
  }
  if (newPin.length < 4) {
    return NextResponse.json({ error: 'PIN moet minimaal 4 cijfers zijn' }, { status: 400 })
  }

  const beg = await prisma.begeleider.findFirst({
    where: { email: email.trim().toLowerCase(), emailVerified: true },
  })
  if (!beg?.emailToken || !beg.tokenExpiry) {
    return NextResponse.json({ error: 'Geen geldig resetverzoek gevonden. Vraag een nieuwe code aan.' }, { status: 400 })
  }
  if (new Date() > beg.tokenExpiry) {
    return NextResponse.json({ error: 'Code verlopen. Vraag een nieuwe aan.' }, { status: 400 })
  }
  if (hashToken(token.trim()) !== beg.emailToken) {
    return NextResponse.json({ error: 'Ongeldige code' }, { status: 400 })
  }

  const pinSalt = generateSalt()
  const pinHash = hashPin(newPin.trim(), pinSalt)

  await prisma.begeleider.update({
    where: { id: beg.id },
    data: { pinHash, pinSalt, emailToken: null, tokenExpiry: null },
  })

  const couple = await prisma.couple.findUnique({ where: { id: beg.coupleId! } })

  return NextResponse.json({
    coupleId: couple!.id,
    coupleCode: couple!.code,
    memberId: beg.memberId,
    memberName: beg.name,
  })
}
