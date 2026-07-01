import { NextRequest, NextResponse } from 'next/server'

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'JezusisHeerindeNGK'

export async function POST(req: NextRequest) {
  const { password } = await req.json()
  if (!password || password !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Ongeldig wachtwoord' }, { status: 401 })
  }
  return NextResponse.json({ ok: true, token: ADMIN_PASSWORD })
}
