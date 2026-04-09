import type { APIRoute } from 'astro'
import { createSession, COOKIE_NAME, COOKIE_OPTIONS, getClientIp } from '@/lib/auth'

export const prerender = false

const MAX_ATTEMPTS = 5
const WINDOW_MS = 15 * 60 * 1000
const attempts = new Map<string, { count: number; first: number }>()

export const POST: APIRoute = async ({ request }) => {
  const ip = getClientIp(request)

  // Rate limiting
  const now = Date.now()
  const record = attempts.get(ip)
  if (record) {
    if (now - record.first > WINDOW_MS) {
      attempts.set(ip, { count: 1, first: now })
    } else if (record.count >= MAX_ATTEMPTS) {
      return new Response('Too many attempts', { status: 429 })
    } else {
      record.count++
    }
  } else {
    attempts.set(ip, { count: 1, first: now })
  }

  const { password } = (await request.json()) as { password: string }
  const adminPassword = (process.env.ADMIN_PASSWORD ?? '').trim()

  if (!adminPassword || password !== adminPassword) {
    return new Response('Unauthorized', { status: 401 })
  }

  // Reset attempts on success
  attempts.delete(ip)

  const token = createSession(ip)
  return new Response(JSON.stringify({ ok: true }), {
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': `${COOKIE_NAME}=${token}; ${COOKIE_OPTIONS}`,
    },
  })
}
