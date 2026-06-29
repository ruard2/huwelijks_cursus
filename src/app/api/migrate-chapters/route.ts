import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isEditor } from '@/lib/roles'
import { DELEN } from '@/content'

export async function POST(req: NextRequest) {
  const memberName = req.headers.get('x-member-name') ?? ''
  if (!isEditor(memberName)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { deelId } = await req.json()
  const deel = DELEN.find(d => d.id === deelId)
  if (!deel) return NextResponse.json({ error: 'Deel not found' }, { status: 404 })

  let count = 0
  for (let i = 0; i < deel.chapters.length; i++) {
    const ch = deel.chapters[i]
    await prisma.dynamicChapter.upsert({
      where: { id: ch.id },
      create: { id: ch.id, deelId: deel.id, order: i },
      update: {},
    })
    count++
  }

  return NextResponse.json({ migrated: count })
}
