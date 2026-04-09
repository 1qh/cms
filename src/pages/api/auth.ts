import type { APIRoute } from 'astro'

export const prerender = false

export const POST: APIRoute = async ({ request }) => {
  const { password } = (await request.json()) as { password: string }

  if (password !== import.meta.env.ADMIN_PASSWORD) {
    return new Response('Unauthorized', { status: 401 })
  }

  return new Response(JSON.stringify({ token: import.meta.env.GITHUB_TOKEN }), {
    headers: { 'Content-Type': 'application/json' },
  })
}
