import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { MDXRemote } from 'next-mdx-remote/rsc'
import {
  getAllPosts,
  getPost,
  getRelatedPosts,
  getSeriesContext,
} from '@/lib/posts'
import { mdxOptions } from '@/lib/mdx'
import { site, siteUrl, categoryMap } from '@/lib/site'
import { mdxComponents } from '@/components/mdx'
import { Toc } from '@/components/ui/Toc'
import { SeriesNav } from '@/components/ui/SeriesNav'
import { AuthorCard } from '@/components/ui/AuthorCard'
import { CategoryBadge } from '@/components/ui/CategoryBadge'
import { TagChip } from '@/components/ui/TagChip'

export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const post = getPost(slug)
  if (!post) return {}

  const url = `${siteUrl}/posts/${post.slug}`
  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: `/posts/${post.slug}` },
    openGraph: {
      type: 'article',
      url,
      title: post.title,
      description: post.excerpt,
      publishedTime: post.date,
      authors: [site.author.name],
      tags: post.tags,
      images: post.cover ? [post.cover] : undefined,
    },
    twitter: {
      card: post.cover ? 'summary_large_image' : 'summary',
      title: post.title,
      description: post.excerpt,
      images: post.cover ? [post.cover] : undefined,
    },
  }
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = getPost(slug)
  if (!post) notFound()

  const seriesContext = getSeriesContext(post)
  const related = getRelatedPosts(post)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: post.title,
    description: post.excerpt,
    datePublished: post.date,
    dateModified: post.date,
    inLanguage: 'zh-CN',
    keywords: post.tags.join(', '),
    articleSection: categoryMap[post.category].label,
    author: { '@type': 'Person', name: site.author.name },
    publisher: { '@type': 'Organization', name: site.name },
    mainEntityOfPage: `${siteUrl}/posts/${post.slug}`,
    ...(post.cover ? { image: `${siteUrl}${post.cover}` } : {}),
  }

  return (
    <div className="mx-auto grid max-w-[1080px] grid-cols-1 items-start gap-12 px-5 py-10 sm:px-8 lg:grid-cols-[minmax(0,1fr)_232px] lg:gap-14">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <article className="min-w-0 max-w-[46em]">
        <Link
          href="/"
          className="rail transition-colors hover:text-brand"
        >
          ← 文章列表
        </Link>

        <div className="mb-4 mt-6 flex flex-wrap items-center gap-3">
          <CategoryBadge category={post.category} />
          <time dateTime={post.date} className="rail">
            {post.date}
          </time>
          <span className="rail">{post.readingMinutes} min read</span>
        </div>

        <h1 className="display m-0 mb-5 text-[28px] sm:text-[34px]">
          {post.title}
        </h1>

        {/* 摘要是文章的承诺，单独一档字号并压一条线，和正文分开 */}
        <p className="m-0 mb-8 border-b border-line pb-8 text-[16.5px] leading-[1.8] text-ink-soft">
          {post.excerpt}
        </p>

        {seriesContext ? (
          <SeriesNav series={seriesContext.series} current={post} />
        ) : null}

        {post.cover ? (
          <div className="relative mb-8 aspect-[2/1] overflow-hidden rounded border border-line">
            <Image
              src={post.cover}
              alt={post.title}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 720px"
              className="object-cover"
            />
          </div>
        ) : null}

        <div className="prose">
          <MDXRemote
            source={post.body}
            components={mdxComponents}
            options={mdxOptions}
          />
        </div>

        {post.tags.length > 0 ? (
          <div className="mt-9 flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <TagChip key={tag} label={tag} />
            ))}
          </div>
        ) : null}

        {seriesContext?.prev || seriesContext?.next ? (
          <nav className="mt-8 grid gap-3 sm:grid-cols-2">
            {seriesContext.prev ? (
              <Link
                href={`/posts/${seriesContext.prev.slug}`}
                className="border border-line p-4 transition-colors hover:border-brand"
              >
                <div className="tag-line mb-1.5 text-faint">
                  ← 系列上一篇
                </div>
                <div className="text-sm leading-snug text-ink">
                  {seriesContext.prev.title}
                </div>
              </Link>
            ) : (
              <span />
            )}
            {seriesContext.next ? (
              <Link
                href={`/posts/${seriesContext.next.slug}`}
                className="border border-line p-4 text-right transition-colors hover:border-brand"
              >
                <div className="tag-line mb-1.5 text-faint">
                  系列下一篇 →
                </div>
                <div className="text-sm leading-snug text-ink">
                  {seriesContext.next.title}
                </div>
              </Link>
            ) : null}
          </nav>
        ) : null}

        <hr className="my-8 border-0 border-t border-line" />
        <AuthorCard />
      </article>

      <aside className="hidden flex-col gap-8 lg:sticky lg:top-24 lg:flex">
        <Toc headings={post.headings} />

        {related.length > 0 ? (
          <div>
            <div className="tag-line mb-3.5 border-b border-line pb-2 text-faint">
              Related
            </div>
            <ul className="flex flex-col gap-3">
              {related.map((r) => (
                <li key={r.slug}>
                  <Link
                    href={`/posts/${r.slug}`}
                    className="block text-[12.5px] leading-snug text-muted transition-colors hover:text-brand"
                  >
                    {r.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </aside>
    </div>
  )
}
