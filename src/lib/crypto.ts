'use client'

const SALT = 'huwelijkscursus-v1'

async function deriveKey(coupleCode: string): Promise<CryptoKey> {
  const enc = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(coupleCode.toUpperCase()),
    'PBKDF2',
    false,
    ['deriveKey']
  )
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: enc.encode(SALT), iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

export async function encryptAnswer(text: string, coupleCode: string): Promise<string> {
  if (!text) return ''
  const key = await deriveKey(coupleCode)
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encoded = new TextEncoder().encode(text)
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded)
  const combined = new Uint8Array(iv.byteLength + ciphertext.byteLength)
  combined.set(iv, 0)
  combined.set(new Uint8Array(ciphertext), iv.byteLength)
  return btoa(String.fromCharCode(...combined))
}

export async function decryptAnswer(encrypted: string, coupleCode: string): Promise<string> {
  if (!encrypted) return ''
  try {
    const key = await deriveKey(coupleCode)
    const data = Uint8Array.from(atob(encrypted), c => c.charCodeAt(0))
    const iv = data.slice(0, 12)
    const ciphertext = data.slice(12)
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext)
    return new TextDecoder().decode(decrypted)
  } catch {
    return ''
  }
}
