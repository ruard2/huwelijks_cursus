import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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
  const { token } = await req.json()
  if (!token?.trim()) return NextResponse.json({ error: 'Token ontbreekt' }, { status: 400 })

  const pending = await prisma.pendingRegistration.findUnique({ where: { token: token.trim() } })
  if (!pending) return NextResponse.json({ error: 'Link is ongeldig of al gebruikt' }, { status: 400 })
  if (new Date() > pending.tokenExpiry) {
    await prisma.pendingRegistration.delete({ where: { id: pending.id } })
    return NextResponse.json({ error: 'Link is verlopen. Registreer opnieuw.' }, { status: 400 })
  }

  let coupleId: string
  let coupleCode: string
  let memberId: string

  if (pending.partnerCode) {
    const couple = await prisma.couple.findUnique({ where: { code: pending.partnerCode } })
    if (!couple) return NextResponse.json({ error: 'De koppelcode van je partner is niet meer geldig' }, { status: 400 })
    coupleId = couple.id
    coupleCode = couple.code
    const existing = await prisma.member.findUnique({ where: { coupleId_name: { coupleId, name: pending.name } } })
    if (existing) {
      memberId = existing.id
    } else {
      const member = await prisma.member.create({ data: { coupleId, name: pending.name } })
      memberId = member.id
    }
  } else {
    let code = generateCode()
    for (let i = 0; i < 10; i++) {
      if (!await prisma.couple.findUnique({ where: { code } })) break
      code = generateCode()
    }
    const couple = await prisma.couple.create({
      data: {
        code,
        email: pending.email,
        begeleiderName: pending.begeleiderName,
      },
    })
    coupleId = couple.id
    coupleCode = couple.code
    const member = await prisma.member.create({ data: { coupleId, name: pending.name } })
    memberId = member.id
  }

  await prisma.pendingRegistration.delete({ where: { id: pending.id } })

  return NextResponse.json({
    coupleId,
    coupleCode,
    memberId,
    memberName: pending.name,
    begeleiderName: pending.begeleiderName ?? 'Ruard Stolper',
  })
}
