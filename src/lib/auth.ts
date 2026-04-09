import { createHmac, timingSafeEqual } from 'node:crypto'

const SECRET = process.env.SESSION_SECRET ?? 'fallback-dev-secret'
const MAX_AGE = 3600 // 1 hour

interface SessionPayload {
  exp: number
  ip: string
}

export function createSession(ip: string): string {
  const payload: SessionPayload = {
    exp: Math.floor(Date.now() / 1000) + MAX_AGE,
    ip,
  }
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const sig = createHmac('sha256', SECRET).update(data).digest('base64url')
  return `${data}.${sig}`
}

export function verifySession(token: string, ip: string): boolean {
  const parts = token.split('.')
  if (parts.length !== 2) return false
  const [data, sig] = parts
  const expected = createHmac('sha256', SECRET).update(data).digest('base64url')
  if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return false

  try {
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString()) as SessionPayload
    if (payload.exp < Math.floor(Date.now() / 1000)) return false
    if (payload.ip !== ip) return false
    return true
  } catch {
    return false
  }
}

export const COOKIE_NAME = 'session'
export const COOKIE_OPTIONS = `HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${MAX_AGE}`

export function getClientIp(request: Request): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
}
