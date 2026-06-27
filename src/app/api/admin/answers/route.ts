import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isEditor } from '@/lib/roles'

export async function GET(req: NextRequest) {
  const memberName = req.headers.get('x-member-name') ?? ''
  if (!isEditor(memberName)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const chapterId = req.nextUrl.searchParams.get('chapterId')
  if (!chapterId) return NextResponse.json({ error: 'chapterId required' }, { status: 400 })

  const answers = await prisma.answer.findMany({
    where: { chapterId },
    include: { member: { select: { id: true, name: true, coupleId: true } } },
    orderBy: { updatedAt: 'asc' },
  })

  // Group by couple → member
  const byCouple: Record<string, { memberName: string; answers: typeof answers }[]> = {}
  for (const a of answers) {
    const cId = a.member.coupleId
    if (!byCouple[cId]) byCouple[cId] = []
    let memberGroup = byCouple[cId].find(g => g.memberName === a.member.name)
    if (!memberGroup) {
      memberGroup = { memberName: a.member.name, answers: [] }
      byCouple[cId].push(memberGroup)
    }
    memberGroup.answers.push(a)
  }

  return NextResponse.json({ byCouple })
}

export async function PATCH(req: NextRequest) {
  const memberName = req.headers.get('x-member-name') ?? ''
  if (!isEditor(memberName)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id, value } = await req.json()
  const updated = await prisma.answer.update({
    where: { id },
    data: { value, isPrivate: false },
  })
  return NextResponse.json({ answer: updated })
}
