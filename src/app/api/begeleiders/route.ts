import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Strip common Dutch/German titles before searching
function stripTitle(name: string) {
  return name.replace(/^(ds\.?|dr\.?|drs\.?|prof\.?|ir\.?|mr\.?)\s+/i, '').trim()
}

export async function GET(req: NextRequest) {
  // Exact match check (used at login to determine if user is a begeleider)
  const exact = req.nextUrl.searchParams.get('exact')
  if (exact) {
    const found = await prisma.begeleider.findUnique({ where: { name: exact.trim() } })
    const isAdmin = exact.trim() === 'Ruard Stolper'
    return NextResponse.json({ isBegeleider: !!(found || isAdmin) })
  }

  const q = req.nextUrl.searchParams.get('q') ?? ''
  const search = stripTitle(q).toLowerCase()

  // Always include Ruard Stolper (admin) as default begeleider
  const all = await prisma.begeleider.findMany({ orderBy: { name: 'asc' } })
  const adminEntry = { id: 'admin', name: 'Ruard Stolper' }
  const list = [adminEntry, ...all.filter(b => b.name !== 'Ruard Stolper')]

  if (!search) return NextResponse.json({ begeleiders: list })

  const filtered = list.filter(b => stripTitle(b.name).toLowerCase().includes(search))
  return NextResponse.json({ begeleiders: filtered })
}

export async function POST(req: NextRequest) {
  const { name } = await req.json()
  if (!name?.trim()) return NextResponse.json({ error: 'name required' }, { status: 400 })
  const clean = name.trim()
  const begeleider = await prisma.begeleider.upsert({
    where: { name: clean },
    create: { name: clean },
    update: {},
  })
  return NextResponse.json({ begeleider })
}
