import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAdmin } from '@/lib/roles'

export async function GET(req: NextRequest) {
  const memberName = req.headers.get('x-member-name') ?? ''
  if (!isAdmin(memberName)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const bOverrides = await prisma.begeleiderContentOverride.findMany({
    orderBy: [{ begeleiderName: 'asc' }, { key: 'asc' }],
  })

  // Get base values for comparison
  const uniqueKeys = [...new Set(bOverrides.map(o => o.key))]
  const baseList = await prisma.contentOverride.findMany({ where: { key: { in: uniqueKeys } } })
  const baseMap: Record<string, string> = {}
  for (const b of baseList) baseMap[b.key] = b.value

  const changes = bOverrides.map(o => ({
    id: o.id,
    key: o.key,
    begeleiderName: o.begeleiderName,
    value: o.value,
    baseValue: baseMap[o.key] ?? null,
    updatedAt: o.updatedAt,
  }))

  return NextResponse.json({ changes })
}

export async function POST(req: NextRequest) {
  const memberName = req.headers.get('x-member-name') ?? ''
  if (!isAdmin(memberName)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id, key, value } = await req.json() as { id: string; key: string; value: string }
  if (!key || !value) return NextResponse.json({ error: 'Missing key or value' }, { status: 400 })

  // Adopt: copy begeleider override to base ContentOverride
  const override = await prisma.contentOverride.upsert({
    where: { key },
    create: { key, value },
    update: { value },
  })

  return NextResponse.json({ override })
}
