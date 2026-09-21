'use client'

import {
  createContext,
  useContext,
  useDeferredValue,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  JsonSyntaxError,
  jsPath,
  load,
  pythonPath,
  sortKeys,
  stats,
  stripBom,
  stringify,
  type JsonNode,
  type Path,
} from '@/lib/json'

const SAMPLE = `{"code":0,"msg":"success","data":{"total":2,"hasMore":false,"list":[{"id":1789982744123456789,"title":"Scrapy 的 FEEDS 为什么全有或全无","author":{"uid":"u_1024","name":"网虫"},"tags":["Scrapy","调试"],"stats":{"view":9652,"like":713,"ratio":0.0739},"publishedAt":"2026-09-05T10:00:00+08:00","cover":null,"pinned":true},{"id":1789982744123456790,"title":"一个 MD5 签名的完整还原过程","author":{"uid":"u_2048","name":"网虫"},"tags":["逆向","签名"],"stats":{"view":12031,"like":1284,"ratio":0.1067},"publishedAt":"2026-08-21T09:30:00+08:00","cover":"/covers/sign.png","pinned":false}]}}`

type Mode = 'tree' | 'pretty' | 'minify' | 'escape'
const MODES: { value: Mode; label: string }[] = [
  { value: 'tree', label: '树形' },
  { value: 'pretty', label: '格式化' },
  { value: 'minify', label: '压缩' },
  { value: 'escape', label: '转义' },
]
const INDENTS = { '2': '  ', '4': '    ', tab: '\t' } as const

/** 节点多到这个数就只默认展开前两层，免得一次渲染几十万行 */
const AUTO_COLLAPSE_NODES = 3000
/** 单个对象 / 数组一次最多渲染的子项数，剩下的点了再加 */
const CHUNK = 100

const label = 'font-mono text-[10px] tracking-[0.1em] text-faint'
const action =
  'font-mono text-[11px] text-muted transition-colors hover:text-brand disabled:opacity-40'
const panel =
  'h-[380px] lg:h-[560px] w-full border border-line bg-raised font-mono text-[12.5px] leading-relaxed text-ink'

function useCopy(): [string | null, (key: string, value: string) => void] {
  const [copied, setCopied] = useState<string | null>(null)
  async function copy(key: string, value: string) {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(key)
      setTimeout(() => setCopied((c) => (c === key ? null : c)), 1600)
    } catch {
      // 非 HTTPS 环境下剪贴板不可用，读者手动选中即可
    }
  }
  return [copied, copy]
}

type TreeState = {
  selected: string
  select: (path: Path) => void
  openDepth: number
}
const TreeContext = createContext<TreeState>({
  selected: '',
  select: () => {},
  openDepth: Infinity,
})

/** 超出 2^53 的整数，JSON.parse 读进来末几位会变 */
function isUnsafeInteger(raw: string): boolean {
  return /^-?\d{16,}$/.test(raw) && !Number.isSafeInteger(Number(raw))
}

function Scalar({ node }: { node: JsonNode }) {
  switch (node.kind) {
    case 'string':
      return <span className="break-all text-pass">{JSON.stringify(node.value)}</span>
    case 'number':
      return (
        <span className="text-alt">
          {node.raw}
          {isUnsafeInteger(node.raw) && (
            <span
              title="超出 JavaScript 安全整数范围，用 JSON.parse 读取会丢失末几位。这里按原文保留。"
              className="ml-2 inline-block whitespace-nowrap border border-alt-edge px-1 font-mono text-[10px] text-alt"
            >
              大数
            </span>
          )}
        </span>
      )
    case 'boolean':
      return <span className="text-brand">{String(node.value)}</span>
    case 'null':
      return <span className="text-brand">null</span>
    default:
      return null
  }
}

function TreeNode({
  node,
  name,
  path,
  depth,
  last,
}: {
  node: JsonNode
  name: string | number | null
  path: Path
  depth: number
  last: boolean
}) {
  const { selected, select, openDepth } = useContext(TreeContext)
  const [open, setOpen] = useState(depth < openDepth)
  const [limit, setLimit] = useState(CHUNK)

  const isContainer = node.kind === 'object' || node.kind === 'array'
  const size = node.kind === 'object' ? node.entries.length : node.kind === 'array' ? node.items.length : 0
  const [openMark, closeMark] = node.kind === 'object' ? ['{', '}'] : ['[', ']']
  const comma = last ? '' : ','
  const isSelected = selected === JSON.stringify(path)

  const key =
    name === null ? null : typeof name === 'number' ? (
      <span className="text-faint">{name}: </span>
    ) : (
      <span className="text-ink">{JSON.stringify(name)}: </span>
    )

  const row = `flex cursor-pointer items-start rounded-[2px] px-1 hover:bg-brand-wash ${
    isSelected ? 'bg-brand-tint hover:bg-brand-tint' : ''
  }`

  if (!isContainer) {
    return (
      <div className={row} onClick={() => select(path)}>
        <span className="w-[1.1em] shrink-0" />
        <span className="min-w-0">
          {key}
          <Scalar node={node} />
          {comma}
        </span>
      </div>
    )
  }

  const toggle = (
    <button
      type="button"
      aria-label={open ? '折叠' : '展开'}
      aria-expanded={open}
      onClick={(e) => {
        e.stopPropagation()
        setOpen(!open)
      }}
      className="w-[1.1em] shrink-0 text-left text-faint hover:text-brand"
    >
      {size === 0 ? '' : open ? '▾' : '▸'}
    </button>
  )

  if (!open || size === 0) {
    return (
      <div className={row} onClick={() => select(path)}>
        {toggle}
        <span className="min-w-0">
          {key}
          {openMark}
          {size > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setOpen(true)
              }}
              className="px-1 text-faint hover:text-brand"
            >
              …
            </button>
          )}
          {closeMark}
          {comma}
          {size > 0 && (
            <span className="ml-2 text-[11px] text-faint">
              {size} {node.kind === 'object' ? '个键' : '项'}
            </span>
          )}
        </span>
      </div>
    )
  }

  const children =
    node.kind === 'object'
      ? node.entries.slice(0, limit).map(([k, v], idx) => (
          <TreeNode
            key={idx}
            node={v}
            name={k}
            path={[...path, k]}
            depth={depth + 1}
            last={idx === size - 1}
          />
        ))
      : node.kind === 'array'
        ? node.items.slice(0, limit).map((v, idx) => (
            <TreeNode
              key={idx}
              node={v}
              name={idx}
              path={[...path, idx]}
              depth={depth + 1}
              last={idx === size - 1}
            />
          ))
        : null

  return (
    <div>
      <div className={row} onClick={() => select(path)}>
        {toggle}
        <span>
          {key}
          {openMark}
        </span>
      </div>
      <div className="ml-[0.55em] border-l border-line pl-[0.9em]">
        {children}
        {size > limit && (
          <button
            type="button"
            onClick={() => setLimit(limit + CHUNK * 10)}
            className="my-1 ml-[1.1em] px-1 font-mono text-[11px] text-brand hover:underline"
          >
            还有 {size - limit} 项，继续显示
          </button>
        )}
      </div>
      <div className="px-1 pl-[calc(1.1em+0.25rem)]">
        {closeMark}
        {comma}
      </div>
    </div>
  )
}

function ErrorView({
  error,
  input,
  onLocate,
}: {
  error: JsonSyntaxError | Error
  input: string
  onLocate: (offset: number) => void
}) {
  if (!(error instanceof JsonSyntaxError)) {
    return <p className="m-0 p-4 text-fail">{error.message}</p>
  }
  const line = stripBom(input).trim().split('\n')[error.line - 1] ?? ''
  // 超长的单行（压缩过的 JSON）只截出错位置附近一段
  const from = Math.max(0, error.column - 40)
  const snippet = line.slice(from, error.column + 40)
  const caret = error.column - 1 - from

  return (
    <div className="p-4">
      <p className="m-0 font-sans text-[13.5px] text-fail">
        第 {error.line} 行第 {error.column} 列：{error.message}
      </p>
      <pre className="m-0 mt-3 overflow-x-auto whitespace-pre text-[12.5px] text-ink">
        {(from > 0 ? '…' : '') + snippet}
        {'\n'}
        <span className="text-fail">{' '.repeat(caret + (from > 0 ? 1 : 0)) + '^'}</span>
      </pre>
      <button type="button" onClick={() => onLocate(error.offset)} className={`${action} mt-3`}>
        在输入框里定位
      </button>
    </div>
  )
}

type Result =
  | { ok: true; root: JsonNode; notes: string[]; nodes: number; depth: number }
  | { ok: false; error: JsonSyntaxError | Error }
  | null

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / 1024 / 1024).toFixed(2)} MB`
}

export function JsonTool() {
  const [input, setInput] = useState('')
  const [mode, setMode] = useState<Mode>('tree')
  const [indent, setIndent] = useState<keyof typeof INDENTS>('2')
  const [sorted, setSorted] = useState(false)
  const [asciiOnly, setAsciiOnly] = useState(false)
  const [selection, setSelection] = useState<{ source: JsonNode; path: Path } | null>(null)
  const [openDepth, setOpenDepth] = useState<number | null>(null)
  const [treeKey, setTreeKey] = useState(0)
  const [copied, copy] = useCopy()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // 粘进几 MB 的 JSON 时，先让输入框响应，解析放到空闲时做
  const deferred = useDeferredValue(input)
  const stale = deferred !== input

  const result: Result = useMemo(() => {
    if (!deferred.trim()) return null
    try {
      const { root, notes } = load(deferred)
      return { ok: true, root, notes, ...stats(root) }
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error : new Error('解析失败') }
    }
  }, [deferred])

  const root = useMemo(
    () => (result?.ok ? (sorted ? sortKeys(result.root) : result.root) : null),
    [result, sorted],
  )

  const output = useMemo(() => {
    if (!root) return ''
    if (mode === 'minify') return stringify(root, { indent: null, asciiOnly })
    if (mode === 'escape') return JSON.stringify(stringify(root, { indent: null, asciiOnly }))
    return stringify(root, { indent: INDENTS[indent], asciiOnly })
  }, [root, mode, indent, asciiOnly])

  const effectiveDepth =
    openDepth ?? (result?.ok && result.nodes > AUTO_COLLAPSE_NODES ? 2 : Infinity)

  // 选中的路径只对选它时的那份数据有效：输入一变，旧路径可能已经不存在了。
  // 按未排序的解析结果比对，切换键排序不影响路径
  const source = result?.ok ? result.root : null
  const selected = selection && selection.source === source ? selection.path : null

  const tree = useMemo<TreeState>(
    () => ({
      selected: selected ? JSON.stringify(selected) : '',
      select: (path) => source && setSelection({ source, path }),
      openDepth: effectiveDepth,
    }),
    [selected, source, effectiveDepth],
  )

  // IBM Plex Mono 不含中文，几 MB 的文本里每个汉字都要回退查字形，
  // 实测 4 MB 输入框渲染要 5 秒多；大内容改用系统等宽字体，降到 0.6 秒左右
  const heavyFont =
    input.length > 200_000
      ? { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace' }
      : undefined

  function replaceInput(value: string) {
    setInput(value)
    setOpenDepth(null)
    setTreeKey((k) => k + 1)
  }

  function expandAll(depth: number) {
    setOpenDepth(depth)
    setTreeKey((k) => k + 1)
  }

  function locate(offset: number) {
    const el = textareaRef.current
    if (!el) return
    // 报错位置是按去掉首尾空白后的文本算的，换回原文里的下标
    const lead = input.length - stripBom(input).trimStart().length
    const at = offset + lead
    el.focus()
    el.setSelectionRange(at, at + 1)
    // 把光标所在行滚到可见区域中间
    const lineHeight = parseFloat(getComputedStyle(el).lineHeight) || 20
    const line = input.slice(0, at).split('\n').length
    el.scrollTop = Math.max(0, (line - 5) * lineHeight)
  }

  function download() {
    const blob = new Blob([output], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = mode === 'escape' ? 'escaped.txt' : 'data.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const check = 'flex cursor-pointer items-center gap-1.5 font-mono text-[11px] text-muted'

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div className="min-w-0">
        <div className="mb-2 flex items-center gap-3">
          <label htmlFor="json-input" className={label}>
            INPUT
          </label>
          <button type="button" onClick={() => replaceInput(SAMPLE)} className={`${action} ml-auto`}>
            填入示例
          </button>
          <button type="button" onClick={() => fileRef.current?.click()} className={action}>
            打开文件
          </button>
          <button type="button" onClick={() => replaceInput('')} className={action}>
            清空
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".json,.txt,application/json,text/plain"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0]
              if (file) replaceInput(await file.text())
              e.target.value = ''
            }}
          />
        </div>
        <textarea
          id="json-input"
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          spellCheck={false}
          style={heavyFont}
          placeholder={'粘贴 JSON，接口响应、JSONP、转义过的 JSON 字符串都可以。'}
          className={`${panel} resize-none p-4 outline-none transition-colors placeholder:text-faint focus:border-brand`}
        />
        <div className="mt-2 flex min-h-[1.5em] flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[11px] text-faint">
          {result?.ok && (
            <>
              <span className="text-pass">✓ 合法 JSON</span>
              <span>{formatBytes(new Blob([deferred]).size)}</span>
              <span>{result.nodes.toLocaleString()} 个节点</span>
              <span>深度 {result.depth}</span>
            </>
          )}
          {result?.ok && result.notes.map((n) => <span key={n} className="text-brand">{n}</span>)}
          {result && !result.ok && <span className="text-fail">✗ 不是合法 JSON</span>}
          {stale && <span>解析中…</span>}
        </div>
      </div>

      <div className="min-w-0">
        <div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-2">
          <div role="tablist" className="flex gap-3">
            {MODES.map((m) => (
              <button
                key={m.value}
                type="button"
                role="tab"
                aria-selected={mode === m.value}
                onClick={() => setMode(m.value)}
                className={`font-mono text-[11px] transition-colors ${
                  mode === m.value ? 'text-brand underline decoration-brand-edge underline-offset-4' : 'text-muted hover:text-ink'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-4">
            <button
              type="button"
              onClick={() => copy('output', output)}
              disabled={!output}
              className={action}
            >
              {copied === 'output' ? '已复制' : '复制'}
            </button>
            <button type="button" onClick={download} disabled={!output} className={action}>
              下载
            </button>
          </div>
        </div>

        <div className="mb-2 flex min-h-[1.5em] flex-wrap items-center gap-x-4 gap-y-2">
          {mode === 'tree' ? (
            <>
              <button type="button" onClick={() => expandAll(Infinity)} disabled={!root} className={action}>
                全部展开
              </button>
              <button type="button" onClick={() => expandAll(1)} disabled={!root} className={action}>
                全部折叠
              </button>
            </>
          ) : (
            mode === 'pretty' && (
              <label className={check}>
                缩进
                <select
                  value={indent}
                  onChange={(e) => setIndent(e.target.value as keyof typeof INDENTS)}
                  className="border-none bg-transparent font-mono text-[11px] text-ink outline-none"
                >
                  <option value="2">2 空格</option>
                  <option value="4">4 空格</option>
                  <option value="tab">Tab</option>
                </select>
              </label>
            )
          )}
          <label className={`${check} ml-auto`}>
            <input type="checkbox" checked={sorted} onChange={(e) => setSorted(e.target.checked)} className="accent-brand" />
            键排序
          </label>
          <label className={check} title="与 Python json.dumps 默认的 ensure_ascii=True 一致">
            <input
              type="checkbox"
              checked={asciiOnly}
              onChange={(e) => setAsciiOnly(e.target.checked)}
              disabled={mode === 'tree'}
              className="accent-brand"
            />
            中文转 \u
          </label>
        </div>

        <div className={`${panel} overflow-auto`}>
          {!result && <p className="m-0 p-4 text-faint">左侧粘贴 JSON 后自动解析。</p>}
          {result && !result.ok && <ErrorView error={result.error} input={deferred} onLocate={locate} />}
          {root && mode === 'tree' && (
            <div className="p-3">
              <TreeContext.Provider value={tree}>
                <TreeNode key={treeKey} node={root} name={null} path={[]} depth={0} last />
              </TreeContext.Provider>
            </div>
          )}
          {root && mode !== 'tree' && (
            <pre
              style={heavyFont}
              className={`m-0 p-4 ${mode === 'pretty' ? 'whitespace-pre' : 'whitespace-pre-wrap break-all'}`}
            >
              {output}
            </pre>
          )}
        </div>

        <div className="mt-2 flex min-h-[1.5em] flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[11px]">
          {mode === 'tree' && selected && selected.length > 0 ? (
            <>
              <span className="text-faint">路径</span>
              <span className="min-w-0 break-all text-ink">{jsPath(selected)}</span>
              <span className="ml-auto flex gap-4">
                <button type="button" onClick={() => copy('js', jsPath(selected))} className={action}>
                  {copied === 'js' ? '已复制' : '复制 JS'}
                </button>
                <button type="button" onClick={() => copy('py', pythonPath(selected))} className={action}>
                  {copied === 'py' ? '已复制' : '复制 Python'}
                </button>
              </span>
            </>
          ) : (
            mode === 'tree' && root && <span className="text-faint">点击任意节点，取它的访问路径</span>
          )}
        </div>
      </div>
    </div>
  )
}
