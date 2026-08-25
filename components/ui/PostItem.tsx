import Link from 'next/link'
import type { Post } from '@/lib/posts'
import { CategoryBadge } from './CategoryBadge'

/**
 * 列表的主形态：左侧一条等宽导轨放日期，右侧是内容。
 *
 * 日期从正文流里挪进固定导轨，扫读时时间轴自己立起来，
 * 标题行也不必再被元信息挤占——这是十六进制编辑器地址列的用法。
 */
export function PostItem({ post }: { post: Post }) {
  return (
    <Link
      href={`/posts/${post.slug}`}
      className="group grid gap-x-6 gap-y-2 border-b border-line py-5 sm:grid-cols-[68px_minmax(0,1fr)]"
    >
      <time
        dateTime={post.date}
        className="rail pt-[3px] transition-colors group-hover:text-brand sm:text-right"
      >
        {post.date}
      </time>

      <div className="min-w-0">
        <h3 className="mb-1.5 text-[17px] font-semibold leading-snug tracking-[-0.01em] text-ink decoration-brand-edge underline-offset-[5px] group-hover:underline">
          {post.title}
        </h3>
        <p className="m-0 mb-2.5 line-clamp-2 text-[13.5px] leading-relaxed text-muted">
          {post.excerpt}
        </p>
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
          <CategoryBadge category={post.category} />
          {post.tags.slice(0, 2).map((tag) => (
            <span key={tag} className="font-mono text-[11px] text-faint">
              {tag}
            </span>
          ))}
          <span className="rail ml-auto">{post.readingMinutes} min</span>
        </div>
      </div>
    </Link>
  )
}
