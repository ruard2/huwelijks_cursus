import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAdmin } from '@/lib/roles'

export async function GET(req: NextRequest) {
  const memberName = req.headers.get('x-member-name') ?? ''
  if (!memberName) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  if (isAdmin(memberName)) {
    const comments = await prisma.comment.findMany({
      orderBy: { createdAt: 'desc' },
      include: { member: { select: { name: true } } },
    })
    return NextResponse.json({ comments })
  }

  // Check if requester is a registered begeleider
  const begeleider = await prisma.begeleider.findFirst({ where: { name: { equals: memberName, mode: 'insensitive' } } })
  if (!begeleider) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Return only comments from couples assigned to this begeleider
  const comments = await prisma.comment.findMany({
    where: { member: { couple: { begeleiderName: { equals: memberName, mode: 'insensitive' } } } },
    orderBy: { createdAt: 'desc' },
    include: { member: { select: { name: true } } },
  })
  return NextResponse.json({ comments })
}

export async function POST(req: NextRequest) {
  const memberId = req.headers.get('x-member-id')
  if (!memberId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { chapterId, text } = await req.json()
  if (!chapterId || !text?.trim()) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const comment = await prisma.comment.create({
    data: { memberId, chapterId, text: text.trim() },
  })
  return NextResponse.json({ comment })
}

export async function PATCH(req: NextRequest) {
  const memberName = req.headers.get('x-member-name') ?? ''
  if (!memberName) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const isAllowed = isAdmin(memberName) ||
    !!(await prisma.begeleider.findFirst({ where: { name: { equals: memberName, mode: 'insensitive' } } }))
  if (!isAllowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { id } = await req.json()
  await prisma.comment.update({ where: { id }, data: { read: true } })
  return NextResponse.json({ ok: true })
}
