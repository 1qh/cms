import {
  MDXEditor,
  headingsPlugin,
  listsPlugin,
  linkDialogPlugin,
  imagePlugin,
  quotePlugin,
  tablePlugin,
  thematicBreakPlugin,
  markdownShortcutPlugin,
  toolbarPlugin,
  BoldItalicUnderlineToggles,
  BlockTypeSelect,
  ListsToggle,
  CreateLink,
  InsertImage,
  InsertTable,
  InsertThematicBreak,
  type MDXEditorMethods,
} from '@mdxeditor/editor'
import '@mdxeditor/editor/style.css'
import { useRef } from 'react'

export function Editor({
  markdown,
  onChange,
  category,
  folder,
}: {
  markdown: string
  onChange: (md: string) => void
  category: string
  folder?: string
}) {
  const ref = useRef<MDXEditorMethods>(null)

  const imageUploadHandler = async (image: File) => {
    const formData = new FormData()
    formData.append('file', image)

    // Determine the path for the image
    const ext = image.name.split('.').pop() ?? 'jpg'
    const timestamp = Date.now()
    const imagePath = folder
      ? `public/content/${category}/${folder}/${timestamp}.${ext}`
      : `public/content/${category}/temp-${timestamp}.${ext}`

    formData.append('path', imagePath)

    const res = await fetch('/api/admin/upload', {
      method: 'POST',
      body: formData,
    })
    const data = (await res.json()) as { url: string }
    return data.url
  }

  return (
    <MDXEditor
      ref={ref}
      markdown={markdown}
      onChange={onChange}
      contentEditableClassName="prose prose-neutral dark:prose-invert max-w-none min-h-[400px]"
      plugins={[
        headingsPlugin(),
        listsPlugin(),
        linkDialogPlugin(),
        imagePlugin({ imageUploadHandler }),
        quotePlugin(),
        tablePlugin(),
        thematicBreakPlugin(),
        markdownShortcutPlugin(),
        toolbarPlugin({
          toolbarContents: () => (
            <>
              <BoldItalicUnderlineToggles />
              <BlockTypeSelect />
              <ListsToggle />
              <CreateLink />
              <InsertImage />
              <InsertTable />
              <InsertThematicBreak />
            </>
          ),
        }),
      ]}
    />
  )
}
