import type { APIRoute } from 'astro'
import { listDir, getFile, createOrUpdateFile } from '@/lib/github'

export const prerender = false

export const GET: APIRoute = async ({ url }) => {
  const category = url.searchParams.get('category')
  if (!category) {
    // List all categories
    const dirs = await listDir('public/content')
    const categories = []
    for (const d of dirs) {
      if (d.type !== 'dir') continue
      const indexFile = await getFile(`public/content/${d.name}/index.md`)
      if (!indexFile?.content) continue
      const titleMatch = indexFile.content.match(/title:\s*"(.+)"/)
      categories.push({ slug: d.name, title: titleMatch?.[1] ?? d.name })
    }
    return new Response(JSON.stringify(categories), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // List posts in a category
  const dirs = await listDir(`public/content/${category}`)
  const posts = []
  for (const d of dirs) {
    if (d.type !== 'dir') continue
    const match = d.name.match(/^(\d{4}-\d{2}-\d{2})-(.+)$/)
    if (!match) continue
    const indexFile = await getFile(`public/content/${category}/${d.name}/index.md`)
    if (!indexFile?.content) continue
    const titleMatch = indexFile.content.match(/title:\s*"(.+)"/)
    posts.push({
      folder: d.name,
      date: match[1],
      slug: match[2],
      title: titleMatch?.[1] ?? '',
    })
  }
  posts.sort((a, b) => b.date.localeCompare(a.date))
  return new Response(JSON.stringify(posts), {
    headers: { 'Content-Type': 'application/json' },
  })
}

export const POST: APIRoute = async ({ request }) => {
  const { category, title, body, slug } = (await request.json()) as {
    category: string
    title: string
    body: string
    slug: string
  }

  const date = new Date().toISOString().slice(0, 10)
  const folder = `${date}-${slug}`
  const path = `public/content/${category}/${folder}/index.md`
  const content = `---\ntitle: "${title}"\n---\n\n${body}\n`

  await createOrUpdateFile(path, content, `Add: ${title}`)

  return new Response(JSON.stringify({ ok: true, folder }), {
    headers: { 'Content-Type': 'application/json' },
  })
}
