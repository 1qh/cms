import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/AppSidebar'

interface Category {
  slug: string
  title: string
}

export function SidebarLayout({
  categories,
  currentPath,
  children,
}: {
  categories: Category[]
  currentPath: string
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <AppSidebar categories={categories} currentPath={currentPath} />
      <SidebarInset>
        <header className="flex h-12 items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
        </header>
        <main className="flex-1 px-4 pb-8">
          {children}
        </main>
        <footer className="text-center text-sm text-muted-foreground py-8">
          © {new Date().getFullYear()} Họ Lại Việt Nam
        </footer>
      </SidebarInset>
    </SidebarProvider>
  )
}
