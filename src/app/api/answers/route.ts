import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { pusherServer, coupleChannel, EVENTS } from '@/lib/pusher'

async function getMemberAndCouple(req: NextRequest) {
  const memberId = req.headers.get('x-member-id')
  if (!memberId) return null
  const member = await prisma.member.findUnique({
    where: { id: memberId },
    include: { couple: true },
  })
  return member
}

export async function GET(req: NextRequest) {
  const memberId = req.nextUrl.searchParams.get('memberId')
  const chapterId = req.nextUrl.searchParams.get('chapterId')
  if (!memberId || !chapterId) {
    return NextResponse.json({ error: 'Missing params' }, { status: 400 })
  }

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
    where: { memberId: { in: allMemberIds }, chapterId },
    include: { member: { select: { id: true, name: true } } },
  })

  return NextResponse.json({ answers })
}

export async function POST(req: NextRequest) {
  const member = await getMemberAndCouple(req)
  if (!member) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { chapterId, questionId, value, isPrivate } = await req.json()
  if (!chapterId || !questionId) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const answer = await prisma.answer.upsert({
    where: { memberId_chapterId_questionId: { memberId: member.id, chapterId, questionId } },
    create: { memberId: member.id, chapterId, questionId, value: value ?? '', isPrivate: isPrivate ?? false },
    update: { value: value ?? '', isPrivate: isPrivate ?? false },
  })

  await pusherServer.trigger(
    coupleChannel(member.couple.code),
    EVENTS.ANSWER_UPDATED,
    {
      memberId: member.id,
      memberName: member.name,
      chapterId,
      questionId,
      value,
      isPrivate,
    }
  )

  return NextResponse.json({ answer })
}
