import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'JezusisHeerindeNGK'

function checkAuth(req: NextRequest) {
  return (req.headers.get('x-admin-token') ?? '') === ADMIN_PASSWORD
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const couples = await prisma.couple.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      members: {
        include: {
          progress: true,
          answers: { select: { id: true, chapterId: true, questionId: true, value: true } },
        },
      },
    },
  })

  const result = couples.map(c => ({
    id: c.id,
    code: c.code,
    begeleiderName: c.begeleiderName,
    createdAt: c.createdAt,
    members: c.members.map(m => ({
      id: m.id,
      name: m.name,
      chaptersCompleted: m.progress.filter(p => p.done).length,
      totalChaptersStarted: m.progress.length,
      answerCount: m.answers.filter(a => a.value?.trim()).length,
      byChapter: Object.entries(
        m.answers.reduce<Record<string, number>>((acc, a) => {
          if (a.value?.trim()) acc[a.chapterId] = (acc[a.chapterId] ?? 0) + 1
          return acc
        }, {})
      ).map(([chapterId, count]) => ({ chapterId, count })),
      progressByChapter: m.progress.map(p => ({ chapterId: p.chapterId, done: p.done })),
    })),
  }))

  return NextResponse.json({ couples: result })
}
