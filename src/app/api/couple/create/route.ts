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
  const { name } = await req.json()
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

  const couple = await prisma.couple.create({ data: { code } })
  const member = await prisma.member.create({
    data: { coupleId: couple.id, name: name.trim() },
  })

  return NextResponse.json({
    coupleId: couple.id,
    coupleCode: couple.code,
    memberId: member.id,
    memberName: member.name,
  })
}
