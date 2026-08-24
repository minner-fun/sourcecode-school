import Link from 'next/link'
import type { Post } from '@/lib/posts'
import { Cover } from './Cover'
import { CategoryBadge } from './CategoryBadge'

export function PostCard({ post, priority }: { post: Post; priority?: boolean }) {
  return (
    <Link
      href={`/posts/${post.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-line bg-surface transition-colors hover:border-brand-edge"
    >
      <Cover src={post.cover} alt={post.title} priority={priority} />
      <div className="flex flex-1 flex-col gap-2.5 p-4">
        <div className="flex items-center gap-2.5">
          <CategoryBadge category={post.category} />
          {post.tags[0] ? (
            <span className="text-[11px] text-muted">{post.tags[0]}</span>
          ) : null}
          <time
            dateTime={post.date}
            className="ml-auto font-mono text-[11px] text-faint"
          >
            {post.date}
          </time>
        </div>
        <h3 className="text-[16.5px] font-medium leading-snug tracking-tight text-ink transition-colors group-hover:text-brand">
          {post.title}
        </h3>
        <p className="line-clamp-3 text-[13px] leading-relaxed text-muted">
          {post.excerpt}
        </p>
      </div>
    </Link>
  )
}
