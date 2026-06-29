import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isEditor } from '@/lib/roles'

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (id) {
    const chapter = await prisma.dynamicChapter.findUnique({ where: { id } })
    return NextResponse.json({ chapter })
  }
  const deelId = req.nextUrl.searchParams.get('deelId')
  if (!deelId) return NextResponse.json({ chapters: [] })
  const chapters = await prisma.dynamicChapter.findMany({
    where: { deelId },
    orderBy: { order: 'asc' },
  })
  return NextResponse.json({ chapters })
}

export async function POST(req: NextRequest) {
  const memberName = req.headers.get('x-member-name') ?? ''
  if (!isEditor(memberName)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { deelId } = await req.json()
  if (!deelId) return NextResponse.json({ error: 'deelId required' }, { status: 400 })
  const count = await prisma.dynamicChapter.count({ where: { deelId } })
  const chapter = await prisma.dynamicChapter.create({
    data: { deelId, order: count },
  })
  return NextResponse.json({ chapter })
}

export async function PATCH(req: NextRequest) {
  const memberName = req.headers.get('x-member-name') ?? ''
  if (!isEditor(memberName)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { id, deelId } = await req.json()
  if (!id || !deelId) return NextResponse.json({ error: 'id and deelId required' }, { status: 400 })
  const chapter = await prisma.dynamicChapter.update({ where: { id }, data: { deelId } })
  return NextResponse.json({ chapter })
}

export async function DELETE(req: NextRequest) {
  const memberName = req.headers.get('x-member-name') ?? ''
  if (!isEditor(memberName)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { id } = await req.json()
  await prisma.dynamicChapter.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
