import Link from 'next/link'
import type { Post } from '@/lib/posts'

/** 归档与系列页用的紧凑行，只保留日期、标题和一个标签 */
export function PostRow({ post }: { post: Post }) {
  return (
    <Link
      href={`/posts/${post.slug}`}
      className="group grid grid-cols-[68px_minmax(0,1fr)] items-baseline gap-x-6 gap-y-1 border-b border-line py-3 sm:grid-cols-[68px_minmax(0,1fr)_auto]"
    >
      <time
        dateTime={post.date}
        className="rail transition-colors group-hover:text-brand sm:text-right"
      >
        {post.date}
      </time>
      <span className="text-[15px] leading-normal text-ink decoration-brand-edge underline-offset-[5px] group-hover:underline">
        {post.title}
      </span>
      <span className="col-start-2 font-mono text-[11px] text-faint sm:col-start-3">
        {post.tags[0] ?? post.categoryLabel}
      </span>
    </Link>
  )
}
