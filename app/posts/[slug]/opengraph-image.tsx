import { OG_SIZE, ogCard } from '@/lib/og-card'
import { getAllPosts, getPost } from '@/lib/posts'
import { categoryMap, site } from '@/lib/site'

export const size = OG_SIZE
export const contentType = 'image/png'

/** 和文章页一样全量预生成，纯静态导出时也能有图。 */
export function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }))
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = getPost(slug)
  if (!post) return ogCard({ title: site.tagline })
  return ogCard({
    title: post.title,
    kicker: categoryMap[post.category].label,
    footer: `${site.author.name} · ${post.date}`,
  })
}
