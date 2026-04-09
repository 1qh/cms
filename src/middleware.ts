import { defineMiddleware } from 'astro:middleware'
import { verifySession, COOKIE_NAME, getClientIp } from '@/lib/auth'

export const onRequest = defineMiddleware(async ({ request, url, cookies }, next) => {
  if (url.pathname.startsWith('/api/admin')) {
    const token = cookies.get(COOKIE_NAME)?.value
    if (!token || !verifySession(token, getClientIp(request))) {
      return new Response('Unauthorized', { status: 401 })
    }
  }
  return next()
})
