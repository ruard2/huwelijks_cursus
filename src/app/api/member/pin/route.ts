import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateSalt, hashPin, verifyPin } from '@/lib/auth'

// Set or change PIN for the current member
export async function POST(req: NextRequest) {
  const memberId = req.headers.get('x-member-id') ?? ''
  if (!memberId) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })

  const { currentPin, newPin } = await req.json()
  if (!newPin?.trim()) return NextResponse.json({ error: 'Nieuwe PIN is verplicht' }, { status: 400 })

  const member = await prisma.member.findUnique({ where: { id: memberId } })
  if (!member) return NextResponse.json({ error: 'Niet gevonden' }, { status: 404 })

  // If member already has a PIN, verify the current one first
  if (member.pinHash && member.pinSalt) {
    if (!currentPin?.trim()) return NextResponse.json({ error: 'Huidige PIN is verplicht' }, { status: 400 })
    if (!verifyPin(currentPin.trim(), member.pinSalt, member.pinHash)) {
      return NextResponse.json({ error: 'Huidige PIN klopt niet' }, { status: 401 })
    }
  }

  const pinSalt = generateSalt()
  const pinHash = hashPin(newPin.trim(), pinSalt)
  await prisma.member.update({ where: { id: memberId }, data: { pinHash, pinSalt } })

  return NextResponse.json({ ok: true })
}

// Remove PIN
export async function DELETE(req: NextRequest) {
  const memberId = req.headers.get('x-member-id') ?? ''
  if (!memberId) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })

  const { currentPin } = await req.json()
  const member = await prisma.member.findUnique({ where: { id: memberId } })
  if (!member) return NextResponse.json({ error: 'Niet gevonden' }, { status: 404 })

  if (member.pinHash && member.pinSalt) {
    if (!verifyPin(currentPin?.trim() ?? '', member.pinSalt, member.pinHash)) {
      return NextResponse.json({ error: 'PIN klopt niet' }, { status: 401 })
    }
  }

  await prisma.member.update({ where: { id: memberId }, data: { pinHash: null, pinSalt: null } })
  return NextResponse.json({ ok: true })
}
