import type { APIRoute } from 'astro'
import { getFile, createOrUpdateFile, deleteFile, listDir } from '@/lib/github'

export const prerender = false

export const GET: APIRoute = async ({ params }) => {
  const { category, folder } = params
  const path = `public/content/${category}/${folder}/index.md`
  const file = await getFile(path)
  if (!file?.content) {
    return new Response('Not found', { status: 404 })
  }

  const frontmatterMatch = file.content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/)
  const titleMatch = frontmatterMatch?.[1]?.match(/title:\s*"(.+)"/)

  return new Response(
    JSON.stringify({
      title: titleMatch?.[1] ?? '',
      body: frontmatterMatch?.[2]?.trim() ?? '',
      sha: file.sha,
    }),
    { headers: { 'Content-Type': 'application/json' } }
  )
}

export const PUT: APIRoute = async ({ params, request }) => {
  const { category, folder } = params
  const { title, body } = (await request.json()) as { title: string; body: string }

  const path = `public/content/${category}/${folder}/index.md`
  const existing = await getFile(path)
  const content = `---\ntitle: "${title}"\n---\n\n${body}\n`

  await createOrUpdateFile(path, content, `Update: ${title}`, existing?.sha)

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
}

export const DELETE: APIRoute = async ({ params }) => {
  const { category, folder } = params
  const basePath = `public/content/${category}/${folder}`

  // Delete all files in the folder
  const files = await listDir(basePath)
  for (const f of files) {
    if (f.type === 'file') {
      const fileData = await getFile(`${basePath}/${f.name}`)
      if (fileData) {
        await deleteFile(`${basePath}/${f.name}`, fileData.sha, `Delete: ${folder}/${f.name}`)
      }
    }
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
}
