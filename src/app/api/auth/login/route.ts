import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const { code, name } = await req.json()
  if (!code?.trim() || !name?.trim()) {
    return NextResponse.json({ error: 'Koppelcode en naam zijn verplicht' }, { status: 400 })
  }

  const couple = await prisma.couple.findUnique({
    where: { code: code.trim().toUpperCase() },
    include: { members: true },
  })
  if (!couple) return NextResponse.json({ error: 'Koppelcode niet gevonden' }, { status: 404 })

  const existing = couple.members.find(
    m => m.name.toLowerCase() === name.trim().toLowerCase()
  )
  const member = existing ?? await prisma.member.create({
    data: { coupleId: couple.id, name: name.trim() },
  })

  return NextResponse.json({
    coupleId: couple.id,
    coupleCode: couple.code,
    memberId: member.id,
    memberName: member.name,
    begeleiderName: couple.begeleiderName ?? 'Ruard Stolper',
  })
}
