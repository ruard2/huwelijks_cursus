import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateSalt, hashPin, hashToken } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const { code, name, token, newPin } = await req.json()
  if (!code?.trim() || !name?.trim() || !token?.trim() || !newPin?.trim()) {
    return NextResponse.json({ error: 'Alle velden zijn verplicht' }, { status: 400 })
  }

  const couple = await prisma.couple.findUnique({
    where: { code: code.trim().toUpperCase() },
    include: { members: true },
  })

  if (!couple?.recoveryToken || !couple.tokenExpiry) {
    return NextResponse.json({ error: 'Geen geldig resetverzoek gevonden' }, { status: 400 })
  }

  if (new Date() > couple.tokenExpiry) {
    return NextResponse.json({ error: 'Code is verlopen. Vraag een nieuwe aan.' }, { status: 400 })
  }

  if (hashToken(token.trim()) !== couple.recoveryToken) {
    return NextResponse.json({ error: 'Ongeldige code' }, { status: 400 })
  }

  const member = couple.members.find(
    (m: { name: string }) => m.name.toLowerCase() === name.trim().toLowerCase()
  )
  if (!member) {
    return NextResponse.json({ error: 'Naam niet gevonden' }, { status: 404 })
  }

  const pinSalt = generateSalt()
  const pinHash = hashPin(newPin.trim(), pinSalt)

  await Promise.all([
    prisma.member.update({ where: { id: member.id }, data: { pinHash, pinSalt } }),
    prisma.couple.update({ where: { id: couple.id }, data: { recoveryToken: null, tokenExpiry: null } }),
  ])

  return NextResponse.json({
    coupleId: couple.id,
    coupleCode: couple.code,
    memberId: member.id,
    memberName: member.name,
    hasPin: true,
  })
}
