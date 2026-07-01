import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'JezusisHeerindeNGK'

function checkAuth(req: NextRequest) {
  return (req.headers.get('x-admin-token') ?? '') === ADMIN_PASSWORD
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const [begeleiderCount, coupleCount, memberCount, comments, flags] = await Promise.all([
    prisma.begeleider.count(),
    prisma.couple.count(),
    prisma.member.count(),
    prisma.comment.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        member: {
          select: {
            name: true,
            couple: { select: { code: true, begeleiderName: true } },
          },
        },
      },
    }),
    prisma.questionFlag.findMany({
      orderBy: { createdAt: 'desc' },
    }),
  ])

  return NextResponse.json({ begeleiderCount, coupleCount, memberCount, comments, flags })
}

export async function PATCH(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { type, id } = await req.json()
  if (type === 'comment') {
    await prisma.comment.update({ where: { id }, data: { read: true } })
  } else if (type === 'flag') {
    await prisma.questionFlag.update({ where: { id }, data: { read: true } })
  }
  return NextResponse.json({ ok: true })
}
