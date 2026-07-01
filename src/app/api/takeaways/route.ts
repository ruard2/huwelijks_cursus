import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const memberId = req.nextUrl.searchParams.get('memberId')
  if (!memberId) return NextResponse.json({ error: 'memberId required' }, { status: 400 })

  const member = await prisma.member.findUnique({
    where: { id: memberId },
    include: { couple: { include: { members: true } } },
  })
  if (!member) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const partnerIds = member.couple.members
    .filter((m: { id: string }) => m.id !== memberId)
    .map((m: { id: string }) => m.id)

  const allMemberIds = [memberId, ...partnerIds]

  const answers = await prisma.answer.findMany({
    where: {
      memberId: { in: allMemberIds },
      questionId: { startsWith: 'takeaway.' },
    },
    include: { member: { select: { id: true, name: true } } },
    orderBy: { updatedAt: 'asc' },
  })

  // Group by chapterId
  const byChapter: Record<string, typeof answers> = {}
  for (const a of answers) {
    if (!byChapter[a.chapterId]) byChapter[a.chapterId] = []
    byChapter[a.chapterId].push(a)
  }

  return NextResponse.json({ byChapter, myId: memberId })
}
