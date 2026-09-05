import type { MetadataRoute } from 'next'
import { getAllPosts, getAllSeries, getAllTags } from '@/lib/posts'
import { categories, siteUrl } from '@/lib/site'
import { tools } from '@/lib/tools'

export const dynamic = 'force-static'

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getAllPosts()
  const latest = posts[0]?.date ?? new Date().toISOString().slice(0, 10)

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/`, lastModified: latest, changeFrequency: 'daily', priority: 1 },
    { url: `${siteUrl}/series`, lastModified: latest, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${siteUrl}/tools`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${siteUrl}/archive`, lastModified: latest, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${siteUrl}/subscribe`, changeFrequency: 'yearly', priority: 0.6 },
    { url: `${siteUrl}/about`, changeFrequency: 'yearly', priority: 0.5 },
  ]

  return [
    ...staticPages,
    ...categories.map((c) => ({
      url: `${siteUrl}/category/${c.slug}`,
      lastModified: latest,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
    ...posts.map((post) => ({
      url: `${siteUrl}/posts/${post.slug}`,
      lastModified: post.date,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
    ...getAllSeries().map((s) => ({
      url: `${siteUrl}/series/${s.slug}`,
      lastModified: s.updated,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
    ...getAllTags().map((t) => ({
      url: `${siteUrl}/tags/${encodeURIComponent(t.label)}`,
      changeFrequency: 'weekly' as const,
      priority: 0.4,
    })),
    ...tools
      .filter((t) => t.status === 'ready')
      .map((t) => ({
        url: `${siteUrl}/tools/${t.slug}`,
        changeFrequency: 'monthly' as const,
        priority: 0.6,
      })),
  ]
}
