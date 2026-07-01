import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest) {
  const { coupleCode, begeleiderName } = await req.json()
  if (!coupleCode) return NextResponse.json({ error: 'coupleCode required' }, { status: 400 })
  const couple = await prisma.couple.update({
    where: { code: coupleCode },
    data: { begeleiderName },
  })
  return NextResponse.json({ couple })
}

export async function GET(req: NextRequest) {
  const coupleCode = req.nextUrl.searchParams.get('code')
  if (!coupleCode) return NextResponse.json({ couple: null })
  const couple = await prisma.couple.findUnique({ where: { code: coupleCode } })
  return NextResponse.json({ couple })
}
