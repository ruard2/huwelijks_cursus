import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest) {
  const memberId = req.headers.get('x-member-id')
  if (!memberId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name } = await req.json()
  if (!name?.trim()) return NextResponse.json({ error: 'Naam is verplicht' }, { status: 400 })

  const member = await prisma.member.update({
    where: { id: memberId },
    data: { name: name.trim() },
  })

  return NextResponse.json({ memberName: member.name })
}
