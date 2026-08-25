import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getAllSeries, getSeries } from '@/lib/posts'
import { PostRow } from '@/components/ui/PostRow'
import { HireCard } from '@/components/ui/HireCard'

export function generateStaticParams() {
  return getAllSeries().map((s) => ({ slug: s.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const series = getSeries(slug)
  if (!series) return {}
  return {
    title: series.title,
    description: `系列共 ${series.posts.length} 篇：${series.posts
      .map((p) => p.title)
      .join('；')}`.slice(0, 180),
    alternates: { canonical: `/series/${series.slug}` },
  }
}

export default async function SeriesDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const series = getSeries(slug)
  if (!series) notFound()

  return (
    <div className="mx-auto grid max-w-[1080px] grid-cols-1 items-start gap-12 px-5 py-12 sm:px-8 lg:grid-cols-[minmax(0,1fr)_296px]">
      <div>
        <div className="tag-line mb-4">
          SERIES · {series.posts.length} 篇
        </div>
        <h1 className="display m-0 mb-8 text-[28px] sm:text-[34px]">
          {series.title}
        </h1>
        <div>
          {series.posts.map((post) => (
            <PostRow key={post.slug} post={post} />
          ))}
        </div>
      </div>
      <aside className="lg:sticky lg:top-24">
        <HireCard />
      </aside>
    </div>
  )
}
