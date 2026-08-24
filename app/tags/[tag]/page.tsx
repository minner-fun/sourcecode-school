import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getAllTags, getPostsByTag } from '@/lib/posts'
import { PostCard } from '@/components/ui/PostCard'
import { TagChip } from '@/components/ui/TagChip'

export function generateStaticParams() {
  return getAllTags().map((t) => ({ tag: t.label }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tag: string }>
}): Promise<Metadata> {
  const { tag } = await params
  const label = decodeURIComponent(tag)
  const posts = getPostsByTag(label)
  if (posts.length === 0) return {}
  return {
    title: `标签：${label}`,
    description: `与「${label}」相关的 ${posts.length} 篇文章。`,
    alternates: { canonical: `/tags/${encodeURIComponent(label)}` },
  }
}

export default async function TagPage({
  params,
}: {
  params: Promise<{ tag: string }>
}) {
  const { tag } = await params
  const label = decodeURIComponent(tag)
  const posts = getPostsByTag(label)
  if (posts.length === 0) notFound()

  const others = getAllTags().filter(
    (t) => t.label.toLowerCase() !== label.toLowerCase(),
  )

  return (
    <div className="mx-auto max-w-[1160px] px-5 py-12 sm:px-8">
      <div className="mb-4 font-mono text-[11px] tracking-[0.14em] text-brand">
        TAG
      </div>
      <h1 className="m-0 mb-3 text-[30px] font-medium leading-tight tracking-tight sm:text-[34px]">
        {label}
      </h1>
      <p className="m-0 mb-8 text-[15.5px] text-muted">共 {posts.length} 篇</p>

      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {posts.map((post) => (
          <PostCard key={post.slug} post={post} />
        ))}
      </div>

      {others.length > 0 ? (
        <div className="mt-12 border-t border-line pt-7">
          <div className="mb-3.5 text-[11px] uppercase tracking-[0.1em] text-faint">
            其他标签
          </div>
          <div className="flex flex-wrap gap-2">
            {others.map((t) => (
              <TagChip key={t.label} label={t.label} count={t.count} />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}
