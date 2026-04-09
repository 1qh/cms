import type { APIRoute } from 'astro'

export const prerender = false

export const POST: APIRoute = async ({ request }) => {
  const { password } = (await request.json()) as { password: string }
  const adminPassword = process.env.ADMIN_PASSWORD ?? import.meta.env.ADMIN_PASSWORD
  const githubToken = process.env.GITHUB_TOKEN ?? import.meta.env.GITHUB_TOKEN

  if (!adminPassword || password !== adminPassword) {
    return new Response('Unauthorized', { status: 401 })
  }

  return new Response(JSON.stringify({ token: githubToken }), {
    headers: { 'Content-Type': 'application/json' },
  })
}
