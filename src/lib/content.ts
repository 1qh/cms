import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const CONTENT_DIR = 'public/content'

export interface Post {
  title: string
  category: string
  date: string
  slug: string
  body: string
  coverUrl: string | null
}

export interface Category {
  slug: string
  title: string
}

function parseFrontmatter(raw: string): { title: string; body: string } {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/)
  if (!match) return { title: '', body: raw }
  const titleMatch = match[1].match(/title:\s*"(.+)"/)
  return { title: titleMatch?.[1] ?? '', body: match[2] }
}

export function getCategories(): Category[] {
  return readdirSync(CONTENT_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && existsSync(join(CONTENT_DIR, d.name, 'index.md')))
    .map((d) => {
      const raw = readFileSync(join(CONTENT_DIR, d.name, 'index.md'), 'utf-8')
      return { slug: d.name, title: parseFrontmatter(raw).title }
    })
    .filter((c) => c.title)
}

export function getPosts(): Post[] {
  const categories = readdirSync(CONTENT_DIR, { withFileTypes: true }).filter((d) => d.isDirectory())

  const posts: Post[] = []

  for (const cat of categories) {
    const catDir = join(CONTENT_DIR, cat.name)
    const entries = readdirSync(catDir, { withFileTypes: true }).filter((d) => d.isDirectory())

    for (const entry of entries) {
      const match = entry.name.match(/^(\d{4}-\d{2}-\d{2})-(.+)$/)
      if (!match) continue

      const indexPath = join(catDir, entry.name, 'index.md')
      if (!existsSync(indexPath)) continue

      const raw = readFileSync(indexPath, 'utf-8')
      const { title, body } = parseFrontmatter(raw)

      const coverExts = ['jpg', 'jpeg', 'png', 'webp']
      const coverFile = coverExts.find((ext) => existsSync(join(catDir, entry.name, `cover.${ext}`)))

      posts.push({
        title,
        category: cat.name,
        date: match[1],
        slug: match[2],
        body,
        coverUrl: coverFile ? `/content/${cat.name}/${entry.name}/cover.${coverFile}` : null,
      })
    }
  }

  return posts.sort((a, b) => b.date.localeCompare(a.date))
}

export function resolveImageUrls(body: string, category: string, folder: string): string {
  return body.replace(
    /!\[([^\]]*)\]\((?!https?:\/\/)([^)]+)\)/g,
    (_, alt: string, src: string) => `![${alt}](/content/${category}/${folder}/${src})`
  )
}
