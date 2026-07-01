import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashToken } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const { coupleCode, token } = await req.json()
  if (!coupleCode?.trim() || !token?.trim()) {
    return NextResponse.json({ error: 'Ontbrekende gegevens' }, { status: 400 })
  }

  const couple = await prisma.couple.findUnique({
    where: { code: coupleCode.trim().toUpperCase() },
  })

  if (!couple?.recoveryToken || !couple.tokenExpiry) {
    return NextResponse.json({ error: 'Geen verificatieverzoek gevonden' }, { status: 400 })
  }
  if (new Date() > couple.tokenExpiry) {
    return NextResponse.json({ error: 'Code verlopen. Registreer opnieuw om een nieuwe code te ontvangen.' }, { status: 400 })
  }
  if (hashToken(token.trim()) !== couple.recoveryToken) {
    return NextResponse.json({ error: 'Ongeldige code' }, { status: 400 })
  }

  await prisma.couple.update({
    where: { id: couple.id },
    data: { recoveryToken: null, tokenExpiry: null },
  })

  return NextResponse.json({ ok: true })
}
