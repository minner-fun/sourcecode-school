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

    // 记录每个标题当前是否在视口内，取最靠上的一个作为高亮项
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
        // 全部滚出视口时，高亮最后一个已经滚过去的标题
        const passed = nodes.filter((n) => n.getBoundingClientRect().top < 0)
        if (passed.length > 0) setActiveId(passed[passed.length - 1].id)
      },
      // 顶部留出吸顶导航的高度，底部收窄以免视口下方的标题抢焦点
      { rootMargin: '-88px 0px -70% 0px', threshold: 0 },
    )

    for (const node of nodes) observer.observe(node)
    return () => observer.disconnect()
  }, [headings])

  if (headings.length === 0) return null

  return (
    <nav aria-label="目录">
      <div className="mb-3.5 text-[11px] uppercase tracking-[0.1em] text-faint">
        目录
      </div>
      <ul className="flex flex-col gap-2.5 border-l border-line pl-3.5">
        {headings.map((h) => (
          <li key={h.id} style={{ paddingLeft: h.depth === 3 ? '0.85rem' : 0 }}>
            <a
              href={`#${h.id}`}
              className={
                activeId === h.id
                  ? 'block text-[13px] leading-snug text-brand'
                  : 'block text-[13px] leading-snug text-muted transition-colors hover:text-ink'
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
