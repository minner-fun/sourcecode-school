'use client'

import { useState } from 'react'

/**
 * RSS 地址是拿来粘进阅读器的，不是拿来点的——点开只会看到一页 XML。
 * 所以这里给复制按钮而不是链接。
 */
export function CopyableUrl({ url }: { url: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // 非 HTTPS 或用户拒绝授权时静默失败，地址本身仍然可以手动选中
    }
  }

  return (
    <div className="flex items-stretch border border-line">
      <code className="min-w-0 flex-1 truncate bg-raised px-3 py-2 font-mono text-[12px] text-ink">
        {url}
      </code>
      <button
        type="button"
        onClick={copy}
        className="shrink-0 border-l border-line px-3 font-mono text-[11px] text-muted transition-colors hover:bg-brand hover:text-bg"
      >
        {copied ? '已复制' : '复制'}
      </button>
    </div>
  )
}
