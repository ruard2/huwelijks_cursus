import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const begeleiderName = req.nextUrl.searchParams.get('begeleiderName')
  const coupleCode = req.nextUrl.searchParams.get('coupleCode')

  if (begeleiderName) {
    const flags = await prisma.questionFlag.findMany({
      where: { begeleiderName },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ flags })
  }
  if (coupleCode) {
    const flags = await prisma.questionFlag.findMany({
      where: { coupleCode },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ flags })
  }
  return NextResponse.json({ flags: [] })
}

export async function POST(req: NextRequest) {
  const { coupleCode, memberNames, begeleiderName, chapterId, questionId, questionText, answerValue, note } = await req.json()
  if (!coupleCode || !begeleiderName || !chapterId) {
    return NextResponse.json({ error: 'missing fields' }, { status: 400 })
  }
  const flag = await prisma.questionFlag.create({
    data: { coupleCode, memberNames: memberNames ?? '', begeleiderName, chapterId, questionId: questionId ?? '', questionText: questionText ?? '', answerValue: answerValue ?? null, note: note ?? null },
  })
  return NextResponse.json({ flag })
}

export async function PATCH(req: NextRequest) {
  const { id, read } = await req.json()
  const flag = await prisma.questionFlag.update({ where: { id }, data: { read } })
  return NextResponse.json({ flag })
}
