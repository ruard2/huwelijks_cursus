import crypto from 'crypto'

export function generateSalt(): string {
  return crypto.randomBytes(16).toString('hex')
}

export function hashPin(pin: string, salt: string): string {
  return crypto.scryptSync(pin, salt, 32).toString('hex')
}

export function verifyPin(pin: string, salt: string, hash: string): boolean {
  try {
    return crypto.timingSafeEqual(
      Buffer.from(hashPin(pin, salt), 'hex'),
      Buffer.from(hash, 'hex'),
    )
  } catch { return false }
}

export function generateToken(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}
