'use client'

import { useRef, useState } from 'react'

/**
 * 代码块包一层复制按钮。
 * 高亮后的 DOM 层级较深，直接读 textContent 比从 React children 里还原纯文本可靠。
 */
export function Pre(props: React.ComponentProps<'pre'>) {
  const ref = useRef<HTMLPreElement>(null)
  const [copied, setCopied] = useState(false)

  async function copy() {
    const text = ref.current?.textContent
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      // 非 HTTPS 或用户拒绝授权时静默失败，读者仍可手动选中复制
    }
  }

  return (
    <div className="group relative">
      <pre ref={ref} {...props} />
      <button
        type="button"
        onClick={copy}
        aria-label="复制代码"
        className="absolute right-2 top-2 rounded-md border border-line bg-surface px-2 py-1 font-mono text-[10px] text-muted opacity-0 transition-opacity hover:text-brand focus-visible:opacity-100 group-hover:opacity-100"
      >
        {copied ? '已复制' : '复制'}
      </button>
    </div>
  )
}
