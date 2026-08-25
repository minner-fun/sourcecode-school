'use client'

import { useEffect, useState } from 'react'
import type { Heading } from '@/lib/posts'

/**
 * 文章目录，带滚动高亮。
 * 用 IntersectionObserver 而不是 scroll 事件，避免长文里频繁触发布局读取。
 */
export function Toc({ headings }: { headings: Heading[] }) {
  const [activeId, setActiveId] = useState<string>(headings[0]?.id ?? '')

  useEffect(() => {
    if (headings.length === 0) return

    const nodes = headings
      .map((h) => document.getElementById(h.id))
      .filter((n): n is HTMLElement => n !== null)
    if (nodes.length === 0) return

    const visible = new Map<string, boolean>()

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          visible.set(entry.target.id, entry.isIntersecting)
        }
        const firstVisible = nodes.find((n) => visible.get(n.id))
        if (firstVisible) {
          setActiveId(firstVisible.id)
          return
        }
        const passed = nodes.filter((n) => n.getBoundingClientRect().top < 0)
        if (passed.length > 0) setActiveId(passed[passed.length - 1].id)
      },
      { rootMargin: '-88px 0px -70% 0px', threshold: 0 },
    )

    for (const node of nodes) observer.observe(node)
    return () => observer.disconnect()
  }, [headings])

  if (headings.length === 0) return null

  return (
    <nav aria-label="目录">
      <div className="tag-line mb-3.5 text-faint">Contents</div>
      <ul className="flex flex-col">
        {headings.map((h) => (
          <li key={h.id}>
            <a
              href={`#${h.id}`}
              style={{ paddingLeft: h.depth === 3 ? '1.5rem' : '0.85rem' }}
              className={
                activeId === h.id
                  ? 'block border-l-2 border-brand py-1.5 text-[12.5px] leading-snug text-brand'
                  : 'block border-l-2 border-line py-1.5 text-[12.5px] leading-snug text-muted transition-colors hover:border-faint hover:text-ink'
              }
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
