import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'

interface Category {
  slug: string
  title: string
}

interface PostSummary {
  folder: string
  date: string
  slug: string
  title: string
}

interface PostDetail {
  title: string
  body: string
  sha: string
}

type View =
  | { type: 'login' }
  | { type: 'categories' }
  | { type: 'posts'; category: Category }
  | { type: 'editor'; category: Category; folder?: string }

function LoginForm({ onLogin }: { onLogin: () => void }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    setLoading(false)
    if (res.ok) {
      onLogin()
    } else if (res.status === 429) {
      setError('Quá nhiều lần thử. Vui lòng đợi 15 phút.')
    } else {
      setError('Sai mật khẩu')
    }
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-xs mt-[30vh] space-y-4">
      <h1 className="text-2xl font-heading font-bold">Đăng nhập</h1>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Mật khẩu"
        autoFocus
        required
        className="w-full rounded-md bg-muted px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
      />
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </form>
  )
}

function CategoryList({
  onSelect,
  onLogout,
}: {
  onSelect: (cat: Category) => void
  onLogout: () => void
}) {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/posts')
      .then((r) => {
        if (r.status === 401) {
          onLogout()
          return []
        }
        return r.json()
      })
      .then(setCategories)
      .finally(() => setLoading(false))
  }, [onLogout])

  if (loading) return <p className="text-muted-foreground">Đang tải...</p>

  return (
    <section className="space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-heading font-bold">Danh mục</h1>
        <Button variant="ghost" size="sm" onClick={onLogout}>
          Đăng xuất
        </Button>
      </header>
      <ul className="space-y-1">
        {categories.map((cat) => (
          <li key={cat.slug}>
            <button
              onClick={() => onSelect(cat)}
              className="w-full text-left px-3 py-2 rounded-md hover:bg-accent transition-colors"
            >
              {cat.title}
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}

function PostList({
  category,
  onBack,
  onNew,
  onEdit,
  onLogout,
}: {
  category: Category
  onBack: () => void
  onNew: () => void
  onEdit: (folder: string) => void
  onLogout: () => void
}) {
  const [posts, setPosts] = useState<PostSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/admin/posts?category=${category.slug}`)
      .then((r) => {
        if (r.status === 401) {
          onLogout()
          return []
        }
        return r.json()
      })
      .then(setPosts)
      .finally(() => setLoading(false))
  }, [category.slug, onLogout])

  const handleDelete = async (post: PostSummary) => {
    if (!confirm(`Xoá "${post.title}"?`)) return
    await fetch(`/api/admin/posts/${category.slug}/${post.folder}`, { method: 'DELETE' })
    setPosts((prev) => prev.filter((p) => p.folder !== post.folder))
  }

  if (loading) return <p className="text-muted-foreground">Đang tải...</p>

  return (
    <section className="space-y-4">
      <header className="flex items-center justify-between">
        <nav className="flex items-center gap-2">
          <button onClick={onBack} className="text-muted-foreground hover:text-foreground transition-colors">
            ←
          </button>
          <h1 className="text-2xl font-heading font-bold">{category.title}</h1>
        </nav>
        <Button size="sm" onClick={onNew}>
          Bài mới
        </Button>
      </header>
      {posts.length === 0 ? (
        <p className="text-muted-foreground">Chưa có bài viết nào.</p>
      ) : (
        <ul className="space-y-1">
          {posts.map((post) => (
            <li key={post.folder} className="flex items-center justify-between px-3 py-2 rounded-md hover:bg-accent transition-colors">
              <button onClick={() => onEdit(post.folder)} className="text-left flex-1 min-w-0">
                <span className="block truncate">{post.title}</span>
                <time className="text-xs text-muted-foreground">{post.date}</time>
              </button>
              <Button variant="ghost" size="sm" onClick={() => handleDelete(post)} className="text-destructive shrink-0 ml-2">
                Xoá
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function PostEditor({
  category,
  folder,
  onBack,
  onLogout,
}: {
  category: Category
  folder?: string
  onBack: () => void
  onLogout: () => void
}) {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [slug, setSlug] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(!!folder)
  const [EditorComponent, setEditorComponent] = useState<React.ComponentType<{
    markdown: string
    onChange: (md: string) => void
    category: string
    folder?: string
  }> | null>(null)

  useEffect(() => {
    import('./Editor').then((mod) => setEditorComponent(() => mod.Editor))
  }, [])

  useEffect(() => {
    if (!folder) return
    fetch(`/api/admin/posts/${category.slug}/${folder}`)
      .then((r) => {
        if (r.status === 401) {
          onLogout()
          return null
        }
        return r.json()
      })
      .then((data: PostDetail | null) => {
        if (data) {
          setTitle(data.title)
          setBody(data.body)
        }
      })
      .finally(() => setLoading(false))
  }, [category.slug, folder, onLogout])

  const save = async () => {
    if (!title.trim()) return
    setSaving(true)

    if (folder) {
      await fetch(`/api/admin/posts/${category.slug}/${folder}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, body }),
      })
    } else {
      const finalSlug =
        slug.trim() ||
        title
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/đ/g, 'd')
          .replace(/Đ/g, 'd')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '')

      await fetch('/api/admin/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: category.slug, title, body, slug: finalSlug }),
      })
    }

    setSaving(false)
    onBack()
  }

  if (loading) return <p className="text-muted-foreground">Đang tải...</p>

  return (
    <section className="space-y-4">
      <header className="flex items-center justify-between">
        <nav className="flex items-center gap-2">
          <button onClick={onBack} className="text-muted-foreground hover:text-foreground transition-colors">
            ←
          </button>
          <h1 className="text-2xl font-heading font-bold">{folder ? 'Sửa bài' : 'Bài mới'}</h1>
        </nav>
        <Button size="sm" onClick={save} disabled={saving || !title.trim()}>
          {saving ? 'Đang lưu...' : 'Lưu'}
        </Button>
      </header>
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Tiêu đề"
        className="w-full rounded-md bg-muted px-3 py-2 text-lg font-medium outline-none focus:ring-2 focus:ring-ring"
      />
      {!folder && (
        <input
          type="text"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="slug (tự động từ tiêu đề nếu để trống)"
          className="w-full rounded-md bg-muted px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
      )}
      {EditorComponent ? (
        <EditorComponent markdown={body} onChange={setBody} category={category.slug} folder={folder} />
      ) : (
        <p className="text-muted-foreground">Đang tải trình soạn thảo...</p>
      )}
    </section>
  )
}

export function AdminApp() {
  const [view, setView] = useState<View>({ type: 'login' })

  const handleLogout = useCallback(async () => {
    await fetch('/api/logout', { method: 'POST' })
    setView({ type: 'login' })
  }, [])

  // Check if already logged in
  useEffect(() => {
    fetch('/api/admin/posts').then((r) => {
      if (r.ok) setView({ type: 'categories' })
    })
  }, [])

  switch (view.type) {
    case 'login':
      return <LoginForm onLogin={() => setView({ type: 'categories' })} />
    case 'categories':
      return (
        <CategoryList
          onSelect={(cat) => setView({ type: 'posts', category: cat })}
          onLogout={handleLogout}
        />
      )
    case 'posts':
      return (
        <PostList
          category={view.category}
          onBack={() => setView({ type: 'categories' })}
          onNew={() => setView({ type: 'editor', category: view.category })}
          onEdit={(folder) => setView({ type: 'editor', category: view.category, folder })}
          onLogout={handleLogout}
        />
      )
    case 'editor':
      return (
        <PostEditor
          category={view.category}
          folder={view.folder}
          onBack={() => setView({ type: 'posts', category: view.category })}
          onLogout={handleLogout}
        />
      )
  }
}
