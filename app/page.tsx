import Link from 'next/link'
import { getAllPosts, getAllSeries, getAllTags } from '@/lib/posts'
import { categories, site } from '@/lib/site'
import { PostItem } from '@/components/ui/PostItem'
import { StatusLadder } from '@/components/ui/StatusLadder'
import { AboutCard } from '@/components/ui/AboutCard'
import { TagChip } from '@/components/ui/TagChip'
import { SectionTitle } from '@/components/ui/SectionTitle'

export default function HomePage() {
  const posts = getAllPosts()
  const latest = posts.slice(0, 12)
  const tags = getAllTags().slice(0, 12)
  const series = getAllSeries().slice(0, 3)

  return (
    <>
      <section className="border-b border-line">
        <div className="mx-auto grid max-w-[1080px] items-center gap-10 px-5 py-14 sm:px-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-16 lg:py-20">
          <div>
            <div className="tag-line mb-5">
              Crawler · Reverse engineering · Data
            </div>
            <h1 className="display m-0 mb-5 max-w-[16em] text-[30px] sm:text-[38px]">
              {site.tagline}
            </h1>
            <p className="m-0 max-w-[38em] text-[15px] leading-[1.85] text-muted">
              {site.description}
            </p>
          </div>
          <StatusLadder />
        </div>
      </section>

      <div className="mx-auto grid max-w-[1080px] grid-cols-1 items-start gap-12 px-5 py-12 sm:px-8 lg:grid-cols-[minmax(0,1fr)_260px] lg:gap-16">
        <div>
          <SectionTitle
            action={
              <div className="hidden gap-4 sm:flex">
                {categories.map((c) => (
                  <Link
                    key={c.slug}
                    href={`/category/${c.slug}`}
                    className="text-[12.5px] text-muted transition-colors hover:text-brand"
                  >
                    {c.label}
                  </Link>
                ))}
              </div>
            }
          >
            最新
          </SectionTitle>

          {latest.length === 0 ? (
            <p className="border border-dashed border-line p-8 text-center text-sm text-muted">
              还没有文章。在 content/posts/ 下新建一个 .mdx 文件，或运行 pnpm new。
            </p>
          ) : (
            <div>
              {latest.map((post) => (
                <PostItem key={post.slug} post={post} />
              ))}
            </div>
          )}

          {posts.length > latest.length ? (
            <div className="pt-6">
              <Link
                href="/archive"
                className="font-mono text-[12.5px] text-brand hover:underline"
              >
                全部 {posts.length} 篇 →
              </Link>
            </div>
          ) : null}
        </div>

        <aside className="flex flex-col gap-9 lg:sticky lg:top-24">
          <AboutCard />

          {series.length > 0 ? (
            <div>
              <div className="tag-line mb-3.5 border-b border-line pb-2 text-faint">
                Series
              </div>
              <ul className="flex flex-col gap-2.5">
                {series.map((s) => (
                  <li key={s.slug}>
                    <Link
                      href={`/series/${s.slug}`}
                      className="flex items-baseline gap-2.5 text-[13px] leading-snug text-muted transition-colors hover:text-brand"
                    >
                      <span className="flex-1">{s.title}</span>
                      <span className="rail">{s.posts.length}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {tags.length > 0 ? (
            <div>
              <div className="tag-line mb-3.5 border-b border-line pb-2 text-faint">
                Tags
              </div>
              <div className="flex flex-wrap gap-1.5">
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
