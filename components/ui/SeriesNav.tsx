import Link from 'next/link'
import type { Post, Series } from '@/lib/posts'

/**
 * 文章顶部的系列进度条。系列是让读者一次看多篇、
 * 也是搜索引擎判断主题权威度的主要结构，所以放在正文之前而不是文末。
 */
export function SeriesNav({
  series,
  current,
}: {
  series: Series
  current: Post
}) {
  return (
    <aside className="mb-7 rounded-xl border border-line bg-raised p-4">
      <div className="mb-2.5 flex items-baseline gap-2.5">
        <span className="font-mono text-[10px] tracking-[0.12em] text-brand">
          SERIES
        </span>
        <Link
          href={`/series/${series.slug}`}
          className="text-sm font-medium text-ink transition-colors hover:text-brand"
        >
          {series.title}
        </Link>
        <span className="ml-auto font-mono text-[11px] text-faint">
          {series.posts.findIndex((p) => p.slug === current.slug) + 1} /{' '}
          {series.posts.length}
        </span>
      </div>
      <ol className="flex flex-col gap-1.5">
        {series.posts.map((p, i) => (
          <li key={p.slug} className="flex gap-2.5 text-[13px] leading-snug">
            <span className="font-mono text-[11px] text-faint">
              {String(i + 1).padStart(2, '0')}
            </span>
            {p.slug === current.slug ? (
              <span className="text-brand">{p.title}</span>
            ) : (
              <Link
                href={`/posts/${p.slug}`}
                className="text-muted transition-colors hover:text-ink"
              >
                {p.title}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </aside>
  )
}
