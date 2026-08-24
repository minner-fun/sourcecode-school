import Link from 'next/link'
import { getAllPosts, getAllSeries, getAllTags } from '@/lib/posts'
import { categories, site } from '@/lib/site'
import { PostCard } from '@/components/ui/PostCard'
import { HireCard } from '@/components/ui/HireCard'
import { TagChip } from '@/components/ui/TagChip'
import { SectionTitle } from '@/components/ui/SectionTitle'

export default function HomePage() {
  const posts = getAllPosts()
  const latest = posts.slice(0, 9)
  const tags = getAllTags().slice(0, 10)
  const series = getAllSeries().slice(0, 3)

  return (
    <>
      <section className="relative overflow-hidden border-b border-line">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-36 -top-72 size-[640px] rounded-full"
          style={{
            background:
              'radial-gradient(circle, var(--brand-tint), transparent 68%)',
          }}
        />
        <div className="relative mx-auto max-w-[1160px] px-5 py-12 sm:px-8 sm:py-14">
          <div className="mb-4 font-mono text-[11px] tracking-[0.14em] text-brand">
            CRAWLER · REVERSE ENGINEERING · DATA
          </div>
          <h1 className="m-0 mb-3.5 max-w-[18em] text-[30px] font-medium leading-tight tracking-tight sm:text-[38px]">
            {site.tagline}
          </h1>
          <p className="m-0 max-w-[42em] text-[15.5px] leading-relaxed text-muted">
            {site.description}
          </p>
        </div>
      </section>

      <div className="mx-auto grid max-w-[1160px] grid-cols-1 items-start gap-12 px-5 py-11 sm:px-8 lg:grid-cols-[minmax(0,1fr)_296px] lg:gap-14">
        <div>
          <SectionTitle
            action={
              <div className="hidden gap-1.5 sm:flex">
                {categories.map((c) => (
                  <Link
                    key={c.slug}
                    href={`/category/${c.slug}`}
                    className="rounded-lg border border-line px-3 py-1 text-[12.5px] text-muted transition-colors hover:border-brand hover:text-brand"
                  >
                    {c.label}
                  </Link>
                ))}
              </div>
            }
          >
            最新文章
          </SectionTitle>

          {latest.length === 0 ? (
            <p className="rounded-xl border border-dashed border-line p-8 text-center text-sm text-muted">
              还没有文章。在 content/posts/ 下新建一个 .mdx 文件，或运行 pnpm new。
            </p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {latest.map((post, i) => (
                <PostCard key={post.slug} post={post} priority={i < 3} />
              ))}
            </div>
          )}

          {posts.length > latest.length ? (
            <div className="pt-6">
              <Link href="/archive" className="text-[13px] text-brand">
                按标签和年份浏览全部 {posts.length} 篇 →
              </Link>
            </div>
          ) : null}
        </div>

        <aside className="flex flex-col gap-6 lg:sticky lg:top-24">
          <HireCard />

          {series.length > 0 ? (
            <div>
              <div className="mb-3 text-[11px] uppercase tracking-[0.1em] text-faint">
                系列
              </div>
              <ul className="flex flex-col gap-2.5">
                {series.map((s) => (
                  <li key={s.slug}>
                    <Link
                      href={`/series/${s.slug}`}
                      className="flex items-baseline gap-2 text-[13.5px] leading-snug text-muted transition-colors hover:text-brand"
                    >
                      <span className="flex-1">{s.title}</span>
                      <span className="font-mono text-[11px] text-faint">
                        {s.posts.length}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {tags.length > 0 ? (
            <div>
              <div className="mb-3 text-[11px] uppercase tracking-[0.1em] text-faint">
                标签
              </div>
              <div className="flex flex-wrap gap-2">
                {tags.map((t) => (
                  <TagChip key={t.label} label={t.label} count={t.count} />
                ))}
              </div>
            </div>
          ) : null}
        </aside>
      </div>
    </>
  )
}
