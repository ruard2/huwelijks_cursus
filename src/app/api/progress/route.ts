import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { pusherServer, coupleChannel, EVENTS } from '@/lib/pusher'

export async function GET(req: NextRequest) {
  const memberId = req.nextUrl.searchParams.get('memberId')
  if (!memberId) return NextResponse.json({ error: 'Missing memberId' }, { status: 400 })

  const member = await prisma.member.findUnique({
    where: { id: memberId },
    include: { couple: { include: { members: true } } },
  })
  if (!member) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const allMemberIds = member.couple.members.map((m: { id: string }) => m.id)
  const progress = await prisma.progress.findMany({
    where: { memberId: { in: allMemberIds } },
    include: { member: { select: { id: true, name: true } } },
  })

  return NextResponse.json({ progress })
}

export async function POST(req: NextRequest) {
  const memberId = req.headers.get('x-member-id')
  if (!memberId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const member = await prisma.member.findUnique({
    where: { id: memberId },
    include: { couple: true },
  })
  if (!member) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { chapterId, done } = await req.json()

  const progress = await prisma.progress.upsert({
    where: { memberId_chapterId: { memberId, chapterId } },
    create: { memberId, chapterId, done },
    update: { done },
  })

  await pusherServer.trigger(
    coupleChannel(member.couple.code),
    EVENTS.PROGRESS_UPDATED,
    { memberId, chapterId, done, memberName: member.name }
  )

  return NextResponse.json({ progress })
}
