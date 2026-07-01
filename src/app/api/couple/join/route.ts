import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateSalt, hashPin, verifyPin } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const { code, name, pin } = await req.json()
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
    // Existing member: check PIN if set
    if (existing.pinHash && existing.pinSalt) {
      if (!pin?.trim()) {
        return NextResponse.json({ pinRequired: true }, { status: 200 })
      }
      if (!verifyPin(pin.trim(), existing.pinSalt, existing.pinHash)) {
        return NextResponse.json({ error: 'Verkeerde PIN' }, { status: 401 })
      }
    }
    return NextResponse.json({
      coupleId: couple.id,
      coupleCode: couple.code,
      memberId: existing.id,
      memberName: existing.name,
      hasPin: !!existing.pinHash,
    })
  }

  if (couple.members.length >= 2) {
    return NextResponse.json({ error: 'Dit koppel heeft al twee deelnemers' }, { status: 400 })
  }

  // New member joining — optionally set PIN immediately
  const pinSalt = pin?.trim() ? generateSalt() : undefined
  const pinHash = pin?.trim() && pinSalt ? hashPin(pin.trim(), pinSalt) : undefined

  const member = await prisma.member.create({
    data: { coupleId: couple.id, name: name.trim(), pinHash, pinSalt },
  })

  return NextResponse.json({
    coupleId: couple.id,
    coupleCode: couple.code,
    memberId: member.id,
    memberName: member.name,
    hasPin: !!pinHash,
  })
}
