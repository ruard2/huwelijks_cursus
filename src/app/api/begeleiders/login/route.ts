import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPin } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const { name, pin } = await req.json()
  if (!name?.trim() || !pin?.trim()) {
    return NextResponse.json({ error: 'Naam en PIN zijn verplicht' }, { status: 400 })
  }

  const beg = await prisma.begeleider.findUnique({ where: { name: name.trim() } })
  if (!beg?.emailVerified) {
    return NextResponse.json({ error: 'Geen account gevonden. Registreer eerst als begeleider.' }, { status: 404 })
  }
  if (!beg.pinHash || !beg.pinSalt) {
    return NextResponse.json({ error: 'Geen PIN ingesteld.' }, { status: 400 })
  }
  if (!verifyPin(pin.trim(), beg.pinSalt, beg.pinHash)) {
    return NextResponse.json({ error: 'PIN klopt niet' }, { status: 401 })
  }

  const couple = await prisma.couple.findUnique({ where: { id: beg.coupleId! } })
  if (!couple) {
    return NextResponse.json({ error: 'Account beschadigd. Neem contact op met de beheerder.' }, { status: 500 })
  }

  return NextResponse.json({
    coupleId: couple.id,
    coupleCode: couple.code,
    memberId: beg.memberId,
    memberName: beg.name,
  })
}
