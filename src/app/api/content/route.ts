import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isEditor } from '@/lib/roles'

export async function GET(req: NextRequest) {
  const prefix = req.nextUrl.searchParams.get('prefix') ?? ''
  const overrides = await prisma.contentOverride.findMany({
    where: prefix ? { key: { startsWith: prefix } } : undefined,
  })
  const map: Record<string, string> = {}
  for (const o of overrides) map[o.key] = o.value
  return NextResponse.json({ overrides: map })
}

export async function POST(req: NextRequest) {
  const memberName = req.headers.get('x-member-name') ?? ''
  if (!isEditor(memberName)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { key, value } = await req.json()
  if (!key) return NextResponse.json({ error: 'Missing key' }, { status: 400 })

  const override = await prisma.contentOverride.upsert({
    where: { key },
    create: { key, value },
    update: { value },
  })
  return NextResponse.json({ override })
}
