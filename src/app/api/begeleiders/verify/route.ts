import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateSalt, hashPin, hashToken } from '@/lib/auth'

function randCode(len = 6) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let r = ''
  for (let i = 0; i < len; i++) r += chars[Math.floor(Math.random() * chars.length)]
  return r
}

export async function POST(req: NextRequest) {
  const { name, token, newPin } = await req.json()
  if (!name?.trim() || !token?.trim() || !newPin?.trim()) {
    return NextResponse.json({ error: 'Alle velden zijn verplicht' }, { status: 400 })
  }
  if (newPin.length < 4) {
    return NextResponse.json({ error: 'PIN moet minimaal 4 cijfers zijn' }, { status: 400 })
  }

  const beg = await prisma.begeleider.findUnique({ where: { name: name.trim() } })
  if (!beg?.emailToken || !beg.tokenExpiry) {
    return NextResponse.json({ error: 'Geen verificatieverzoek gevonden. Vraag een nieuwe code aan.' }, { status: 400 })
  }
  if (new Date() > beg.tokenExpiry) {
    return NextResponse.json({ error: 'Code verlopen. Vraag een nieuwe code aan.' }, { status: 400 })
  }
  if (hashToken(token.trim()) !== beg.emailToken) {
    return NextResponse.json({ error: 'Ongeldige code' }, { status: 400 })
  }

  const pinSalt = generateSalt()
  const pinHash = hashPin(newPin.trim(), pinSalt)

  let coupleId = beg.coupleId
  let memberId = beg.memberId
  let coupleCode = ''

  if (!coupleId || !memberId) {
    let code = ''
    for (let i = 0; i < 10; i++) {
      code = `BEG-${randCode(6)}`
      const exists = await prisma.couple.findUnique({ where: { code } })
      if (!exists) break
    }
    const couple = await prisma.couple.create({
      data: { code, email: beg.email ?? undefined },
    })
    const member = await prisma.member.create({
      data: { coupleId: couple.id, name: beg.name },
    })
    coupleId = couple.id
    memberId = member.id
    coupleCode = couple.code
  } else {
    const couple = await prisma.couple.findUnique({ where: { id: coupleId } })
    coupleCode = couple?.code ?? ''
  }

  await prisma.begeleider.update({
    where: { id: beg.id },
    data: { pinHash, pinSalt, emailVerified: true, emailToken: null, tokenExpiry: null, coupleId, memberId },
  })

  return NextResponse.json({ coupleId, coupleCode, memberId, memberName: beg.name })
}
