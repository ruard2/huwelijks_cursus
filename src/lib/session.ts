'use client'

const KEYS = {
  memberId: 'hc_member_id',
  memberName: 'hc_member_name',
  coupleId: 'hc_couple_id',
  coupleCode: 'hc_couple_code',
  isSingle: 'hc_is_single',
  begeleiderName: 'hc_begeleider_name',
} as const

export interface Session {
  memberId: string
  memberName: string
  coupleId: string
  coupleCode: string
  isSingle: boolean
  begeleiderName?: string
}

export function getSession(): Session | null {
  if (typeof window === 'undefined') return null
  const memberId = localStorage.getItem(KEYS.memberId)
  const memberName = localStorage.getItem(KEYS.memberName)
  const coupleId = localStorage.getItem(KEYS.coupleId)
  const coupleCode = localStorage.getItem(KEYS.coupleCode)
  if (!memberId || !memberName || !coupleId || !coupleCode) return null
  return {
    memberId,
    memberName,
    coupleId,
    coupleCode,
    isSingle: localStorage.getItem(KEYS.isSingle) === '1',
    begeleiderName: localStorage.getItem(KEYS.begeleiderName) ?? undefined,
  }
}

export function setSession(session: Session) {
  localStorage.setItem(KEYS.memberId, session.memberId)
  localStorage.setItem(KEYS.memberName, session.memberName)
  localStorage.setItem(KEYS.coupleId, session.coupleId)
  localStorage.setItem(KEYS.coupleCode, session.coupleCode)
  localStorage.setItem(KEYS.isSingle, session.isSingle ? '1' : '0')
  if (session.begeleiderName) localStorage.setItem(KEYS.begeleiderName, session.begeleiderName)
  else localStorage.removeItem(KEYS.begeleiderName)
}

export function clearSession() {
  Object.values(KEYS).forEach(k => localStorage.removeItem(k))
}
