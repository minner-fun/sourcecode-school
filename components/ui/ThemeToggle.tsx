'use client'

import { useEffect, useState } from 'react'
import { SCHEME_STORAGE_KEY, type Scheme } from '@/lib/theme'

const ORDER: Scheme[] = ['auto', 'light', 'dark']
const LABEL: Record<Scheme, string> = {
  auto: 'AUTO',
  light: 'LIGHT',
  dark: 'DARK',
}

/**
 * 三态循环：跟随系统 → 浅色 → 深色。
 *
 * 用文字而不是日月图标，一是和全站的等宽结构性文字一致，
 * 二是图标切换说不清「跟随系统」这个第三态到底是开还是关。
 */
export function ThemeToggle() {
  // 服务端渲染时读不到 localStorage，挂载前先留空，避免 hydration 不一致
  const [scheme, setScheme] = useState<Scheme | null>(null)

  useEffect(() => {
    const stored = document.documentElement.dataset.scheme
    setScheme(stored === 'light' || stored === 'dark' ? stored : 'auto')
  }, [])

  function cycle() {
    const current = scheme ?? 'auto'
    const next = ORDER[(ORDER.indexOf(current) + 1) % ORDER.length]
    setScheme(next)

    if (next === 'auto') {
      delete document.documentElement.dataset.scheme
    } else {
      document.documentElement.dataset.scheme = next
    }

    try {
      if (next === 'auto') localStorage.removeItem(SCHEME_STORAGE_KEY)
      else localStorage.setItem(SCHEME_STORAGE_KEY, next)
    } catch {
      // 隐私模式下写不进去，当次会话内仍然生效，只是刷新后回到跟随系统
    }
  }

  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={
        scheme ? `配色：${LABEL[scheme]}，点击切换` : '切换配色'
      }
      // 固定宽度，三个词长度不同也不会让导航抖动
      className="w-[52px] shrink-0 border border-line py-1 text-center font-mono text-[10.5px] font-medium tracking-[0.08em] text-faint transition-colors hover:border-brand hover:text-brand"
    >
      {scheme ? LABEL[scheme] : ''}
    </button>
  )
}
