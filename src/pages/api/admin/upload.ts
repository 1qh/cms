import type { APIRoute } from 'astro'
import { uploadBinary, getFile } from '@/lib/github'

export const prerender = false

export const POST: APIRoute = async ({ request }) => {
  const formData = await request.formData()
  const file = formData.get('file') as File | null
  const path = formData.get('path') as string | null

  if (!file || !path) {
    return new Response('Missing file or path', { status: 400 })
  }

  const buffer = await file.arrayBuffer()
  const base64 = Buffer.from(buffer).toString('base64')
  const existing = await getFile(path)

  await uploadBinary(path, base64, `Upload: ${path}`, existing?.sha)

  // Return the public URL
  const publicPath = path.replace('public/content/', '/content/')
  return new Response(JSON.stringify({ url: publicPath }), {
    headers: { 'Content-Type': 'application/json' },
  })
}
