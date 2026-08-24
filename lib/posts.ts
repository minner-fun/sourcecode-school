import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'
import readingTime from 'reading-time'
import GithubSlugger from 'github-slugger'
import { categoryMap, type CategorySlug } from './site'

const POSTS_DIR = path.join(process.cwd(), 'content', 'posts')

export type Heading = { depth: 2 | 3; text: string; id: string }

export type Post = {
  slug: string
  title: string
  date: string
  /** 用于排序与展示的解析结果 */
  timestamp: number
  category: CategorySlug
  categoryLabel: string
  tags: string[]
  excerpt: string
  cover?: string
  /** 系列 slug，同一系列的文章会串成上下篇 */
  series?: string
  seriesTitle?: string
  seriesOrder: number
  draft: boolean
  /** 中文按字数估算，reading-time 默认按英文词计，这里做了修正 */
  readingMinutes: number
  headings: Heading[]
  /** MDX 正文，未编译 */
  body: string
}

function mdxFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) return mdxFiles(full)
    return entry.isFile() && /\.mdx?$/.test(entry.name) ? [full] : []
  })
}

/**
 * 中文阅读时长估算。reading-time 按空格切词，中文正文会被算成极少的词数，
 * 所以中文字符单独按每分钟 450 字计，其余部分沿用 reading-time 的结果。
 */
function estimateMinutes(body: string): number {
  const cjk = (body.match(/[一-鿿]/g) ?? []).length
  const rest = body.replace(/[一-鿿]/g, ' ')
  const restMinutes = readingTime(rest).minutes
  return Math.max(1, Math.round(cjk / 450 + restMinutes))
}

/**
 * 从 markdown 正文里抽取二三级标题做目录。
 * slug 生成用 github-slugger，与 rehype-slug 的行为保持一致，锚点才能对上。
 */
function extractHeadings(body: string): Heading[] {
  const slugger = new GithubSlugger()
  const headings: Heading[] = []
  let inFence = false

  for (const line of body.split('\n')) {
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence
      continue
    }
    if (inFence) continue

    const match = /^(#{2,3})\s+(.+?)\s*#*\s*$/.exec(line)
    if (!match) continue

    // 去掉标题里的行内 markdown 标记，目录里显示纯文本
    const text = match[2]
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
      .trim()

    headings.push({
      depth: match[1].length as 2 | 3,
      text,
      id: slugger.slug(text),
    })
  }
  return headings
}

function parse(file: string): Post {
  const raw = fs.readFileSync(file, 'utf8')
  const { data, content } = matter(raw)
  const rel = path.relative(POSTS_DIR, file)
  const slug = rel.replace(/\.mdx?$/, '').split(path.sep).join('/')

  const required = ['title', 'date', 'category', 'excerpt'] as const
  for (const key of required) {
    if (!data[key]) {
      throw new Error(`content/posts/${rel} 缺少 frontmatter 字段: ${key}`)
    }
  }
  if (!(data.category in categoryMap)) {
    throw new Error(
      `content/posts/${rel} 的 category "${data.category}" 不在 lib/site.ts 的栏目列表里`,
    )
  }

  // gray-matter 会把不带引号的 YAML 日期解析成 Date，统一转成 YYYY-MM-DD
  const date =
    data.date instanceof Date
      ? data.date.toISOString().slice(0, 10)
      : String(data.date)
  const timestamp = Date.parse(date)
  if (Number.isNaN(timestamp)) {
    throw new Error(`content/posts/${rel} 的 date "${date}" 不是合法日期`)
  }

  const category = data.category as CategorySlug

  return {
    slug,
    title: String(data.title),
    date,
    timestamp,
    category,
    categoryLabel: categoryMap[category].label,
    tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
    excerpt: String(data.excerpt),
    cover: data.cover ? String(data.cover) : undefined,
    series: data.series ? String(data.series) : undefined,
    seriesTitle: data.seriesTitle ? String(data.seriesTitle) : undefined,
    seriesOrder: Number(data.seriesOrder ?? 0),
    draft: Boolean(data.draft),
    readingMinutes: estimateMinutes(content),
    headings: extractHeadings(content),
    body: content,
  }
}

let cached: Post[] | null = null

/** 全部文章，按日期倒序。生产构建下过滤掉草稿。 */
export function getAllPosts(): Post[] {
  if (cached) return cached
  const posts = mdxFiles(POSTS_DIR)
    .map(parse)
    .filter((p) => !p.draft || process.env.NODE_ENV === 'development')
    .sort((a, b) => b.timestamp - a.timestamp)

  const seen = new Set<string>()
  for (const p of posts) {
    if (seen.has(p.slug)) throw new Error(`重复的文章 slug: ${p.slug}`)
    seen.add(p.slug)
  }

  cached = posts
  return posts
}

export function getPost(slug: string): Post | undefined {
  return getAllPosts().find((p) => p.slug === slug)
}

export function getPostsByCategory(category: CategorySlug): Post[] {
  return getAllPosts().filter((p) => p.category === category)
}

export function getPostsByTag(tag: string): Post[] {
  const lower = tag.toLowerCase()
  return getAllPosts().filter((p) =>
    p.tags.some((t) => t.toLowerCase() === lower),
  )
}

/** 全部标签，按文章数倒序 */
export function getAllTags(): { label: string; count: number }[] {
  const counts = new Map<string, { label: string; count: number }>()
  for (const post of getAllPosts()) {
    for (const tag of post.tags) {
      const key = tag.toLowerCase()
      const hit = counts.get(key)
      if (hit) hit.count += 1
      else counts.set(key, { label: tag, count: 1 })
    }
  }
  return [...counts.values()].sort(
    (a, b) => b.count - a.count || a.label.localeCompare(b.label, 'zh'),
  )
}

export type Series = {
  slug: string
  title: string
  posts: Post[]
  /** 系列内最新一篇的时间，用于系列列表排序 */
  updated: string
}

/**
 * 系列是搜索引擎判断主题权威度最有效的结构，也是让读者一次看多篇的入口。
 * 系列内按 seriesOrder 正序排列，缺省为发布时间正序。
 */
export function getAllSeries(): Series[] {
  const groups = new Map<string, Post[]>()
  for (const post of getAllPosts()) {
    if (!post.series) continue
    const list = groups.get(post.series) ?? []
    list.push(post)
    groups.set(post.series, list)
  }

  return [...groups.entries()]
    .map(([slug, posts]) => {
      const ordered = [...posts].sort(
        (a, b) => a.seriesOrder - b.seriesOrder || a.timestamp - b.timestamp,
      )
      return {
        slug,
        title: ordered.find((p) => p.seriesTitle)?.seriesTitle ?? slug,
        posts: ordered,
        updated: ordered.reduce(
          (latest, p) => (p.date > latest ? p.date : latest),
          ordered[0].date,
        ),
      }
    })
    .sort((a, b) => b.updated.localeCompare(a.updated))
}

export function getSeries(slug: string): Series | undefined {
  return getAllSeries().find((s) => s.slug === slug)
}

/** 文章在其所属系列中的上下篇 */
export function getSeriesContext(post: Post) {
  if (!post.series) return null
  const series = getSeries(post.series)
  if (!series || series.posts.length < 2) return null
  const index = series.posts.findIndex((p) => p.slug === post.slug)
  return {
    series,
    index,
    prev: index > 0 ? series.posts[index - 1] : undefined,
    next:
      index < series.posts.length - 1 ? series.posts[index + 1] : undefined,
  }
}

/** 同标签优先、同栏目兜底的相关文章 */
export function getRelatedPosts(post: Post, limit = 4): Post[] {
  const scored = getAllPosts()
    .filter((p) => p.slug !== post.slug)
    .map((p) => {
      const shared = p.tags.filter((t) => post.tags.includes(t)).length
      const sameSeries = p.series && p.series === post.series ? 3 : 0
      const sameCategory = p.category === post.category ? 1 : 0
      return { post: p, score: shared * 2 + sameSeries + sameCategory }
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score || b.post.timestamp - a.post.timestamp)

  return scored.slice(0, limit).map((s) => s.post)
}

/** 归档页用：按年份分组 */
export function getArchive(): { year: string; posts: Post[] }[] {
  const groups = new Map<string, Post[]>()
  for (const post of getAllPosts()) {
    const year = post.date.slice(0, 4)
    groups.set(year, [...(groups.get(year) ?? []), post])
  }
  return [...groups.entries()]
    .map(([year, posts]) => ({ year, posts }))
    .sort((a, b) => b.year.localeCompare(a.year))
}
