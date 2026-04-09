import type { APIRoute } from 'astro'

export const prerender = false

export const POST: APIRoute = async ({ request }) => {
  const { password } = (await request.json()) as { password: string }
  const adminPassword = process.env.ADMIN_PASSWORD ?? import.meta.env.ADMIN_PASSWORD
  const githubToken = process.env.GITHUB_TOKEN ?? import.meta.env.GITHUB_TOKEN

  if (!adminPassword || password !== adminPassword) {
    return new Response(JSON.stringify({
      error: 'Unauthorized',
      hasPassword: !!adminPassword,
      envKeys: Object.keys(process.env).filter(k => k.includes('ADMIN') || k.includes('GITHUB')),
    }), { status: 401, headers: { 'Content-Type': 'application/json' } })
  }

  return new Response(JSON.stringify({ token: githubToken }), {
    headers: { 'Content-Type': 'application/json' },
  })
}
