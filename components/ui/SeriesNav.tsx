import Link from 'next/link'
import type { Post, Series } from '@/lib/posts'

/**
 * 文章顶部的系列进度。
 * 系列内的序号是真实顺序——文章确实按这个次序展开——所以编号带信息，不是装饰。
 */
export function SeriesNav({
  series,
  current,
}: {
  series: Series
  current: Post
}) {
  const index = series.posts.findIndex((p) => p.slug === current.slug)

  return (
    <aside className="mb-8 border-t-2 border-brand bg-surface px-4 pb-3.5 pt-3">
      <div className="mb-2.5 flex items-baseline gap-3">
        <span className="tag-line">Series</span>
        <Link
          href={`/series/${series.slug}`}
          className="text-[13.5px] font-semibold text-ink transition-colors hover:text-brand"
        >
          {series.title}
        </Link>
        <span className="rail ml-auto">
          {index + 1} / {series.posts.length}
        </span>
      </div>
      <ol className="flex flex-col gap-1">
        {series.posts.map((p, i) => (
          <li key={p.slug} className="flex gap-3 text-[13px] leading-snug">
            <span
              className={
                p.slug === current.slug
                  ? 'rail text-brand'
                  : 'rail'
              }
            >
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
