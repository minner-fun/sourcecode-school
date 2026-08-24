import type { Metadata } from 'next'
import Link from 'next/link'
import { getAllSeries } from '@/lib/posts'

export const metadata: Metadata = {
  title: '系列',
  description:
    '按主题成组的文章。一个系列把一件事从定位、分析到复现完整写完，适合连着看。',
  alternates: { canonical: '/series' },
}

export default function SeriesIndexPage() {
  const series = getAllSeries()

  return (
    <div className="mx-auto max-w-[1160px] px-5 py-12 sm:px-8">
      <div className="mb-4 font-mono text-[11px] tracking-[0.14em] text-brand">
        SERIES
      </div>
      <h1 className="m-0 mb-3 text-[30px] font-medium leading-tight tracking-tight sm:text-[34px]">
        系列
      </h1>
      <p className="m-0 mb-9 max-w-[42em] text-[15.5px] leading-relaxed text-muted">
        一个系列把一件事从定位、分析到脱环境复现完整写完。零散的经验不好判断深浅，成组的更能说明问题。
      </p>

      {series.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line p-8 text-center text-sm text-muted">
          还没有系列。在文章 frontmatter 里加 series 与 seriesOrder 即可自动成组。
        </p>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {series.map((s) => (
            <Link
              key={s.slug}
              href={`/series/${s.slug}`}
              className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-5 transition-colors hover:border-brand-edge"
            >
              <div className="flex items-baseline gap-3">
                <h2 className="m-0 text-[17px] font-medium leading-snug text-ink">
                  {s.title}
                </h2>
                <span className="ml-auto shrink-0 font-mono text-[11px] text-faint">
                  {s.posts.length} 篇
                </span>
              </div>
              <ol className="flex flex-col gap-1.5">
                {s.posts.slice(0, 4).map((p, i) => (
                  <li
                    key={p.slug}
                    className="flex gap-2.5 text-[13px] leading-snug text-muted"
                  >
                    <span className="font-mono text-[11px] text-faint">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="line-clamp-1">{p.title}</span>
                  </li>
                ))}
                {s.posts.length > 4 ? (
                  <li className="pl-[26px] text-[13px] text-faint">
                    还有 {s.posts.length - 4} 篇
                  </li>
                ) : null}
              </ol>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
