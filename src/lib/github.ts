const REPO = '1qh/cms'
const BRANCH = 'main'

function token() {
  const t = process.env.GITHUB_TOKEN
  if (!t) throw new Error('GITHUB_TOKEN not set')
  return t.trim()
}

async function ghFetch(path: string, init?: RequestInit) {
  const res = await fetch(`https://api.github.com${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token()}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`GitHub API ${res.status}: ${body}`)
  }
  return res.json()
}

export interface GHFile {
  path: string
  sha: string
  content?: string
}

export async function getFile(path: string): Promise<GHFile | null> {
  try {
    const data = await ghFetch(`/repos/${REPO}/contents/${path}?ref=${BRANCH}`)
    return {
      path: data.path,
      sha: data.sha,
      content: data.content ? Buffer.from(data.content, 'base64').toString('utf-8') : undefined,
    }
  } catch {
    return null
  }
}

export async function listDir(path: string): Promise<Array<{ name: string; type: string; sha: string }>> {
  try {
    const data = await ghFetch(`/repos/${REPO}/contents/${path}?ref=${BRANCH}`)
    if (!Array.isArray(data)) return []
    return data.map((d: { name: string; type: string; sha: string }) => ({
      name: d.name,
      type: d.type,
      sha: d.sha,
    }))
  } catch {
    return []
  }
}

export async function createOrUpdateFile(
  path: string,
  content: string,
  message: string,
  sha?: string
): Promise<void> {
  await ghFetch(`/repos/${REPO}/contents/${path}`, {
    method: 'PUT',
    body: JSON.stringify({
      message,
      content: Buffer.from(content).toString('base64'),
      branch: BRANCH,
      ...(sha ? { sha } : {}),
    }),
  })
}

export async function uploadBinary(
  path: string,
  base64Content: string,
  message: string,
  sha?: string
): Promise<void> {
  await ghFetch(`/repos/${REPO}/contents/${path}`, {
    method: 'PUT',
    body: JSON.stringify({
      message,
      content: base64Content,
      branch: BRANCH,
      ...(sha ? { sha } : {}),
    }),
  })
}

export async function deleteFile(path: string, sha: string, message: string): Promise<void> {
  await ghFetch(`/repos/${REPO}/contents/${path}`, {
    method: 'DELETE',
    body: JSON.stringify({
      message,
      sha,
      branch: BRANCH,
    }),
  })
}
