import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getPostsByCategory } from '@/lib/posts'
import { categories, categoryMap, type CategorySlug } from '@/lib/site'
import { PostCard } from '@/components/ui/PostCard'

export function generateStaticParams() {
  return categories.map((c) => ({ slug: c.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const category = categoryMap[slug as CategorySlug]
  if (!category) return {}
  return {
    title: category.label,
    description: category.description,
    alternates: { canonical: `/category/${category.slug}` },
  }
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const category = categoryMap[slug as CategorySlug]
  if (!category) notFound()

  const posts = getPostsByCategory(category.slug)

  return (
    <div className="mx-auto max-w-[1160px] px-5 py-12 sm:px-8">
      <div className="mb-4 font-mono text-[11px] tracking-[0.14em] text-brand">
        {category.en}
      </div>
      <h1 className="m-0 mb-3 text-[30px] font-medium leading-tight tracking-tight sm:text-[34px]">
        {category.label}
      </h1>
      <p className="m-0 mb-8 max-w-[42em] text-[15.5px] leading-relaxed text-muted">
        {category.description}
      </p>

      <nav className="mb-9 flex flex-wrap gap-1.5">
        {categories.map((c) => (
          <Link
            key={c.slug}
            href={`/category/${c.slug}`}
            className={
              c.slug === category.slug
                ? 'rounded-lg border border-brand bg-brand-tint px-3 py-1 text-[12.5px] text-brand'
                : 'rounded-lg border border-line px-3 py-1 text-[12.5px] text-muted transition-colors hover:border-brand hover:text-brand'
            }
          >
            {c.label}
          </Link>
        ))}
      </nav>

      {posts.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line p-8 text-center text-sm text-muted">
          这个栏目还没有文章。
        </p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {posts.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      )}
    </div>
  )
}
