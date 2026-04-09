import type { APIRoute } from 'astro'
import { COOKIE_NAME } from '@/lib/auth'

export const prerender = false

export const POST: APIRoute = async () => {
  return new Response(JSON.stringify({ ok: true }), {
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': `${COOKIE_NAME}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`,
    },
  })
}
