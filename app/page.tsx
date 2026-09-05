import Link from 'next/link'
import { getAllPosts, getAllSeries, getAllTags } from '@/lib/posts'
import { site } from '@/lib/site'
import { PostItem } from '@/components/ui/PostItem'
import { CategoryGrid } from '@/components/ui/CategoryGrid'
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
      {/*
        开场只做一件事：说清这站是什么，然后立刻交出三条线的入口。
        栏目卡自带标题和说明，不需要再加一层「三条线」的小标题。
      */}
      <section className="border-b border-line">
        <div className="mx-auto max-w-[1080px] px-5 py-12 sm:px-8 sm:py-14">
          {/* 与下方栏目卡的 en 标签一一对应，让眼眉承担结构提示而不只是装饰 */}
          <div className="tag-line mb-5">
            Reverse · Teardown · Engineering
          </div>
          <h1 className="display m-0 mb-5 max-w-[15em] text-[30px] sm:text-[40px]">
            {site.tagline}
          </h1>
          <p className="m-0 mb-10 max-w-[36em] text-[15px] leading-[1.85] text-muted">
            {site.description}
          </p>
          <CategoryGrid posts={posts} />
        </div>
      </section>

      <div className="mx-auto grid max-w-[1080px] grid-cols-1 items-start gap-12 px-5 py-11 sm:px-8 lg:grid-cols-[minmax(0,1fr)_260px] lg:gap-16">
        <div>
          <SectionTitle
            action={
              posts.length > latest.length ? (
                <Link
                  href="/archive"
                  className="font-mono text-[12px] text-muted transition-colors hover:text-brand"
                >
                  全部 {posts.length} 篇 →
                </Link>
              ) : null
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

          <div className="flex flex-wrap gap-x-6 gap-y-2 pt-6">
            <Link
              href="/archive"
              className="font-mono text-[12.5px] text-brand hover:underline"
            >
              按年份归档 →
            </Link>
            <Link
              href="/feed.xml"
              className="font-mono text-[12.5px] text-muted transition-colors hover:text-brand"
            >
              RSS 订阅
            </Link>
          </div>
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
