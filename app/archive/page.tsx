import type { Metadata } from 'next'
import { getAllPosts, getAllTags, getArchive } from '@/lib/posts'
import { PostRow } from '@/components/ui/PostRow'
import { TagChip } from '@/components/ui/TagChip'

export const metadata: Metadata = {
  title: '归档',
  description: '按年份与标签浏览全部文章。',
  alternates: { canonical: '/archive' },
}

export default function ArchivePage() {
  const archive = getArchive()
  const total = getAllPosts().length
  const tags = getAllTags()

  return (
    <div className="mx-auto grid max-w-[1080px] grid-cols-1 items-start gap-12 px-5 py-12 sm:px-8 lg:grid-cols-[minmax(0,1fr)_260px] lg:gap-14">
      <div>
        <div className="tag-line mb-4">
          ARCHIVE
        </div>
        <h1 className="display m-0 mb-9 text-[28px] sm:text-[34px]">
          全部 {total} 篇
        </h1>

        {archive.map((group) => (
          <section key={group.year} className="mb-9">
            <div className="mb-2 flex items-baseline gap-3.5">
              <span className="font-mono text-[22px] font-medium text-brand">
                {group.year}
              </span>
              <span className="text-xs text-faint">
                {group.posts.length} 篇
              </span>
              <span className="h-px flex-1 bg-gradient-to-r from-line to-transparent" />
            </div>
            {group.posts.map((post) => (
              <PostRow key={post.slug} post={post} />
            ))}
          </section>
        ))}
      </div>

      <aside className="lg:sticky lg:top-24">
        <div className="tag-line mb-3.5 border-b border-line pb-2 text-faint">
          按标签
        </div>
        <div className="flex flex-wrap gap-2">
          {tags.map((t) => (
            <TagChip key={t.label} label={t.label} count={t.count} />
          ))}
        </div>
      </aside>
    </div>
  )
}
