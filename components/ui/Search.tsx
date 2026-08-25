'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { CategoryBadge } from './CategoryBadge'
import type { CategorySlug } from '@/lib/site'

export type SearchEntry = {
  slug: string
  title: string
  excerpt: string
  tags: string[]
  category: CategorySlug
  date: string
}

/**
 * 把命中的词标出来。中文没有词边界，直接按子串切，
 * 不做分词——查询词通常就是标题里的原词。
 */
function highlight(text: string, terms: string[]) {
  if (terms.length === 0) return text
  const pattern = terms
    .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('|')
  const parts = text.split(new RegExp(`(${pattern})`, 'gi'))
  return parts.map((part, i) =>
    terms.some((t) => t.toLowerCase() === part.toLowerCase()) ? (
      <mark key={i} className="bg-brand-tint text-brand">
        {part}
      </mark>
    ) : (
      part
    ),
  )
}

export function Search({ entries }: { entries: SearchEntry[] }) {
  const [query, setQuery] = useState('')

  const terms = useMemo(
    () => query.trim().toLowerCase().split(/\s+/).filter(Boolean),
    [query],
  )

  const results = useMemo(() => {
    if (terms.length === 0) return []
    return entries.filter((entry) => {
      const haystack = `${entry.title} ${entry.excerpt} ${entry.tags.join(' ')}`
        .toLowerCase()
      // 多个词之间是「与」的关系，逐词都要命中
      return terms.every((t) => haystack.includes(t))
    })
  }, [entries, terms])

  return (
    <div>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        autoFocus
        placeholder="标题、摘要、标签，多个关键词用空格分隔"
        className="w-full border border-line bg-bg px-4 py-3 font-mono text-[14px] text-ink outline-none transition-colors placeholder:text-faint focus:border-brand"
      />

      <p className="mt-3 text-[13px] text-faint">
        {terms.length === 0
          ? `共 ${entries.length} 篇可搜索`
          : `命中 ${results.length} 篇`}
      </p>

      <div className="mt-6 flex flex-col">
        {results.map((entry) => (
          <Link
            key={entry.slug}
            href={`/posts/${entry.slug}`}
            className="group grid gap-x-6 gap-y-2 border-b border-line py-4 sm:grid-cols-[68px_minmax(0,1fr)]"
          >
            <time
              dateTime={entry.date}
              className="rail pt-[3px] transition-colors group-hover:text-brand sm:text-right"
            >
              {entry.date}
            </time>
            <div className="min-w-0">
              <div className="mb-1.5 text-[16px] font-semibold leading-snug text-ink">
                {highlight(entry.title, terms)}
              </div>
              <p className="m-0 mb-2 text-[13px] leading-relaxed text-muted">
                {highlight(entry.excerpt, terms)}
              </p>
              <CategoryBadge category={entry.category} />
            </div>
          </Link>
        ))}
      </div>

      {terms.length > 0 && results.length === 0 ? (
        <p className="border border-dashed border-line p-8 text-center text-sm text-muted">
          没有匹配的文章。换个词，或者去 <span className="text-brand">归档</span> 按标签浏览。
        </p>
      ) : null}
    </div>
  )
}
