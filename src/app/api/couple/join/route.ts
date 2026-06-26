import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const { code, name } = await req.json()
  if (!code?.trim() || !name?.trim()) {
    return NextResponse.json({ error: 'Code en naam zijn verplicht' }, { status: 400 })
  }

  const couple = await prisma.couple.findUnique({
    where: { code: code.trim().toUpperCase() },
    include: { members: true },
  })
  if (!couple) {
    return NextResponse.json({ error: 'Koppelcode niet gevonden' }, { status: 404 })
  }

  const existing = couple.members.find(
    (m: { name: string }) => m.name.toLowerCase() === name.trim().toLowerCase()
  )
  if (existing) {
    return NextResponse.json({
      coupleId: couple.id,
      coupleCode: couple.code,
      memberId: existing.id,
      memberName: existing.name,
    })
  }

  if (couple.members.length >= 2) {
    return NextResponse.json({ error: 'Dit koppel heeft al twee deelnemers' }, { status: 400 })
  }

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
