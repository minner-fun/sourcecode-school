import Link from 'next/link'
import type { Post } from '@/lib/posts'
import { categories, type CategorySlug } from '@/lib/site'

/*
 * 顶边颜色和文章徽章是同一套：赭石=主线，冷青=源码剖析，中性=工程实践。
 * 读者在列表里看到徽章色，就能对上这里的栏目。
 */
const edge: Record<CategorySlug, string> = {
  reverse: 'border-t-brand',
  teardown: 'border-t-alt',
  engineering: 'border-t-faint',
}

/**
 * 首页的栏目导航。
 *
 * 不只是三个链接：带上篇数和最新一篇，让读者一眼知道每条线有多少东西、
 * 在写什么。空栏目明确写「还没开始」，比留一个点进去发现空白的入口诚实。
 */
export function CategoryGrid({ posts }: { posts: Post[] }) {
  return (
    <nav aria-label="栏目" className="grid gap-px bg-line sm:grid-cols-3">
      {categories.map((c) => {
        const inCategory = posts.filter((p) => p.category === c.slug)
        const latest = inCategory[0]

        return (
          <Link
            key={c.slug}
            href={`/category/${c.slug}`}
            className={`group flex flex-col gap-2.5 border-t-2 bg-bg p-5 transition-colors hover:bg-surface ${edge[c.slug]}`}
          >
            <div className="flex items-baseline gap-3">
              <span className="tag-line text-faint">{c.en}</span>
              <span className="rail ml-auto">
                {inCategory.length > 0 ? `${inCategory.length} 篇` : '筹备中'}
              </span>
            </div>

            <h2 className="m-0 text-[16px] font-semibold leading-snug text-ink">
              {c.label}
            </h2>

            <p className="m-0 flex-1 text-[12.5px] leading-relaxed text-muted">
              {c.description}
            </p>

            <div className="mt-1 border-t border-line pt-2.5">
              {latest ? (
                <span className="line-clamp-1 text-[12.5px] text-ink-soft transition-colors group-hover:text-brand">
                  最新 · {latest.title}
                </span>
              ) : (
                <span className="text-[12.5px] text-faint">
                  这条线还没开始写
                </span>
              )}
            </div>
          </Link>
        )
      })}
    </nav>
  )
}
