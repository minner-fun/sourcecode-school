import Link from 'next/link'
import type { Post } from '@/lib/posts'

/** 归档与系列页用的紧凑行式条目 */
export function PostRow({ post }: { post: Post }) {
  return (
    <Link
      href={`/posts/${post.slug}`}
      className="grid grid-cols-[76px_minmax(0,1fr)] items-baseline gap-x-4 gap-y-1 border-b border-line py-3 transition-colors hover:bg-raised sm:grid-cols-[88px_minmax(0,1fr)_auto] sm:gap-x-5"
    >
      <time dateTime={post.date} className="font-mono text-xs text-faint">
        {post.date}
      </time>
      <span className="text-[15px] leading-normal text-ink">{post.title}</span>
      <span className="col-start-2 text-[11px] text-brand sm:col-start-3">
        {post.tags[0] ?? post.categoryLabel}
      </span>
    </Link>
  )
}
