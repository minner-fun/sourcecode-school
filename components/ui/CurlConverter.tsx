'use client'

import { useMemo, useState } from 'react'
import { convert } from '@/lib/curl'

const SAMPLE = `curl 'https://example.com/api/v2/item?id=1024&t=1755772800123' \\
  -H 'accept: application/json' \\
  -H 'content-type: application/json' \\
  -H 'cookie: sessionid=abc123; region=cn' \\
  -H 'user-agent: Mozilla/5.0' \\
  --data-raw '{"id":1024,"sign":"c41d8f9e2b"}'`

export function CurlConverter() {
  const [input, setInput] = useState('')
  const [copied, setCopied] = useState(false)

  const { code, error } = useMemo(() => convert(input), [input])

  async function copy() {
    if (!code) return
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      // 非 HTTPS 环境下剪贴板不可用，读者手动选中即可
    }
  }

  const box =
    'h-[420px] w-full resize-none rounded-xl border border-line bg-raised p-4 font-mono text-[12.5px] leading-relaxed text-ink outline-none transition-colors placeholder:text-faint focus:border-brand'

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div>
        <div className="mb-2 flex items-center gap-3">
          <label
            htmlFor="curl-input"
            className="font-mono text-[10px] tracking-[0.1em] text-faint"
          >
            CURL
          </label>
          <button
            type="button"
            onClick={() => setInput(SAMPLE)}
            className="ml-auto font-mono text-[11px] text-muted transition-colors hover:text-brand"
          >
            填入示例
          </button>
          <button
            type="button"
            onClick={() => setInput('')}
            className="font-mono text-[11px] text-muted transition-colors hover:text-brand"
          >
            清空
          </button>
        </div>
        <textarea
          id="curl-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          spellCheck={false}
          className={box}
          placeholder={
            '在浏览器 Network 面板右键请求 → Copy → Copy as cURL，粘贴到这里。'
          }
        />
      </div>

      <div>
        <div className="mb-2 flex items-center gap-3">
          <span className="font-mono text-[10px] tracking-[0.1em] text-faint">
            PYTHON
          </span>
          <button
            type="button"
            onClick={copy}
            disabled={!code}
            className="ml-auto font-mono text-[11px] text-muted transition-colors hover:text-brand disabled:opacity-40"
          >
            {copied ? '已复制' : '复制'}
          </button>
        </div>
        <pre className={`${box} overflow-auto`}>
          {error ? (
            <span className="text-amber">{error}</span>
          ) : (
            code || <span className="text-faint">左侧粘贴 curl 后自动生成。</span>
          )}
        </pre>
      </div>
    </div>
  )
}
