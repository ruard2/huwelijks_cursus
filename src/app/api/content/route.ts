import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isEditor } from '@/lib/roles'

export async function GET(req: NextRequest) {
  const prefix = req.nextUrl.searchParams.get('prefix') ?? ''
  const keysParam = req.nextUrl.searchParams.get('keys') ?? ''
  const keys = keysParam ? keysParam.split(',').filter(Boolean) : []
  const begeleiderName = req.nextUrl.searchParams.get('begeleiderName') ?? ''

  const where = keys.length > 0
    ? { key: { in: keys } }
    : prefix ? { key: { startsWith: prefix } } : undefined

  // Fetch base overrides
  const base = await prisma.contentOverride.findMany({ where })
  const map: Record<string, string> = {}
  for (const o of base) map[o.key] = o.value

  // Overlay begeleider-specific overrides if requested
  if (begeleiderName) {
    const bOverrides = await prisma.begeleiderContentOverride.findMany({
      where: {
        begeleiderName,
        ...(keys.length > 0 ? { key: { in: keys } } : prefix ? { key: { startsWith: prefix } } : {}),
      },
    })
    for (const o of bOverrides) map[o.key] = o.value
  }

  return NextResponse.json({ overrides: map })
}

export async function POST(req: NextRequest) {
  const memberName = req.headers.get('x-member-name') ?? ''
  const body = await req.json()
  const { key, value, begeleiderName } = body as { key: string; value: string; begeleiderName?: string }

  if (!key) return NextResponse.json({ error: 'Missing key' }, { status: 400 })

  if (begeleiderName) {
    // Save to begeleider-specific override (no isEditor required)
    const override = await prisma.begeleiderContentOverride.upsert({
      where: { key_begeleiderName: { key, begeleiderName } },
      create: { key, value, begeleiderName, updatedAt: new Date() },
      update: { value, updatedAt: new Date() },
    })
    return NextResponse.json({ override })
  }

  // Base override — requires editor role
  if (!isEditor(memberName)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const override = await prisma.contentOverride.upsert({
    where: { key },
    create: { key, value },
    update: { value },
  })
  return NextResponse.json({ override })
}
