import { OG_SIZE, ogCard } from '@/lib/og-card'
import { getAllPosts, getPost } from '@/lib/posts'
import { site } from '@/lib/site'

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
  // 传 slug 而不是 label：栏目色由 og-card 统一解析，调用方不必知道配色
  return ogCard({
    title: post.title,
    category: post.category,
    footer: `${site.author.name} · ${post.date}`,
  })
}
