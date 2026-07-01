import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'JezusisHeerindeNGK'

function checkAuth(req: NextRequest) {
  const auth = req.headers.get('x-admin-token') ?? ''
  return auth === ADMIN_PASSWORD
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const bOverrides = await prisma.begeleiderContentOverride.findMany({
    orderBy: [{ key: 'asc' }, { begeleiderName: 'asc' }],
  })

  const uniqueKeys = [...new Set(bOverrides.map(o => o.key))]
  const baseList = await prisma.contentOverride.findMany({
    where: { key: { in: uniqueKeys } },
  })
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
  if (!checkAuth(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { key, value } = await req.json() as { key: string; value: string }
  if (!key || value === undefined) return NextResponse.json({ error: 'Missing key or value' }, { status: 400 })

  const override = await prisma.contentOverride.upsert({
    where: { key },
    create: { key, value },
    update: { value },
  })

  return NextResponse.json({ override })
}
