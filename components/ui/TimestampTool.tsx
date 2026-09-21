'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  UNITS,
  ZONES,
  convertLines,
  describe,
  formatOffset,
  parseDateTime,
  parseTimestamp,
  relative,
  toUnit,
  zoneOffset,
  type Unit,
} from '@/lib/timestamp'

const field =
  'h-10 border border-line bg-raised px-3 font-mono text-[13px] text-ink outline-none transition-colors placeholder:text-faint focus:border-brand'
const label = 'font-mono text-[10px] tracking-[0.1em] text-faint'
const action =
  'font-mono text-[11px] text-muted transition-colors hover:text-brand disabled:opacity-40'

/** 服务端渲染时没有“现在”，挂载后才开始走，避免水合不一致 */
function useNow(interval: number): number | null {
  const [now, setNow] = useState<number | null>(null)
  useEffect(() => {
    setNow(Date.now())
    const id = setInterval(() => setNow(Date.now()), interval)
    return () => clearInterval(id)
  }, [interval])
  return now
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      // 非 HTTPS 环境下剪贴板不可用，读者手动选中即可
    }
  }

  return (
    <button type="button" onClick={copy} disabled={!value} className={action}>
      {copied ? '已复制' : '复制'}
    </button>
  )
}

function LiveClock() {
  const [unit, setUnit] = useState<'s' | 'ms'>('s')
  const [paused, setPaused] = useState<string | null>(null)
  const now = useNow(unit === 's' ? 1000 : 50)

  const live = now === null ? '' : unit === 's' ? String(Math.floor(now / 1000)) : String(now)
  const shown = paused ?? live

  return (
    <div className="mb-8 flex flex-wrap items-end gap-x-6 gap-y-4 border border-line bg-surface px-5 py-5">
      <div className="min-w-0">
        <div className={`${label} mb-2`}>当前时间戳</div>
        <div className="flex items-baseline gap-3">
          <span className="font-mono text-[30px] font-semibold leading-none tabular-nums text-ink sm:text-[36px]">
            {shown || '—'}
          </span>
          <span className="font-mono text-[11px] text-brand">
            {unit === 's' ? '秒' : '毫秒'}
          </span>
        </div>
      </div>
      <div className="ml-auto flex items-center gap-4">
        <button
          type="button"
          onClick={() => {
            setUnit(unit === 's' ? 'ms' : 's')
            setPaused(null)
          }}
          className={action}
        >
          切换为{unit === 's' ? '毫秒' : '秒'}
        </button>
        <CopyButton value={shown} />
        <button
          type="button"
          onClick={() => setPaused(paused === null ? live : null)}
          className={action}
        >
          {paused === null ? '暂停' : '继续'}
        </button>
      </div>
    </div>
  )
}

function ResultRow({ name, value }: { name: string; value: string }) {
  return (
    <div className="flex items-baseline gap-4 border-b border-line-soft py-2.5 last:border-b-0">
      <span className="w-[7.5em] shrink-0 whitespace-nowrap text-[12.5px] text-muted">{name}</span>
      <span className="min-w-0 flex-1 break-all font-mono text-[13px] text-ink">
        {value}
      </span>
      <CopyButton value={value} />
    </div>
  )
}

function Results({ children }: { children: ReactNode }) {
  return <div className="mt-4 border-t border-line">{children}</div>
}

function ErrorLine({ message }: { message: string }) {
  return <p className="m-0 mt-4 text-[13px] text-fail">{message}</p>
}

function TimestampToDate({ tz, now }: { tz: string; now: number | null }) {
  const [input, setInput] = useState('')
  const [unit, setUnit] = useState<Unit | 'auto'>('auto')

  // 首次挂载填入当前时间，打开页面就能看到一组完整结果
  useEffect(() => {
    setInput(String(Math.floor(Date.now() / 1000)))
  }, [])

  const parsed = useMemo(() => parseTimestamp(input, unit), [input, unit])
  const result = parsed && !('error' in parsed) ? describe(parsed.ns, tz) : null
  const detected = parsed && !('error' in parsed) ? UNITS.find((u) => u.value === parsed.unit) : null

  return (
    <section className="min-w-0">
      <h2 className="m-0 mb-4 text-[16px] font-semibold text-ink">时间戳 → 日期时间</h2>
      <label htmlFor="ts-input" className={label}>
        TIMESTAMP
      </label>
      <div className="mt-2 flex gap-2">
        <input
          id="ts-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          inputMode="numeric"
          spellCheck={false}
          autoComplete="off"
          placeholder="1789982744"
          className={`${field} min-w-0 flex-1`}
        />
        <select
          aria-label="时间戳单位"
          value={unit}
          onChange={(e) => setUnit(e.target.value as Unit | 'auto')}
          className={field}
        >
          <option value="auto">自动识别</option>
          {UNITS.map((u) => (
            <option key={u.value} value={u.value}>
              {u.label}
            </option>
          ))}
        </select>
      </div>
      <div className="mt-2 flex items-center gap-4">
        <span className="font-mono text-[11px] text-faint">
          {unit === 'auto' && detected ? `按${detected.label}解析` : ' '}
        </span>
        <button
          type="button"
          onClick={() => setInput(String(Math.floor(Date.now() / 1000)))}
          className={`${action} ml-auto`}
        >
          填入当前
        </button>
      </div>

      {parsed && 'error' in parsed && <ErrorLine message={parsed.error} />}
      {result && (
        <Results>
          <ResultRow name="日期时间" value={result.datetime} />
          <ResultRow name="ISO 8601" value={result.iso} />
          <ResultRow name="UTC" value={result.utc} />
          <ResultRow
            name="星期 · 距今"
            value={now === null ? result.weekday : `${result.weekday} · ${relative(result.ms, now)}`}
          />
        </Results>
      )}
    </section>
  )
}

function currentDateTime(tz: string): string {
  return describe(BigInt(Math.floor(Date.now() / 1000)) * 1_000_000_000n, tz).datetime
}

function DateToTimestamp({ tz }: { tz: string }) {
  const [input, setInput] = useState('')
  const [touched, setTouched] = useState(false)

  // 读者没动过输入框时，跟着时区填入“此刻”：挂载时的时区还是默认值，
  // 浏览器本地时区是随后才探测到的。动过之后切换时区，保留墙上时间重新换算
  useEffect(() => {
    if (!touched) setInput(currentDateTime(tz))
  }, [tz, touched])

  const parsed = useMemo(() => parseDateTime(input, tz), [input, tz])

  return (
    <section className="min-w-0">
      <h2 className="m-0 mb-4 text-[16px] font-semibold text-ink">日期时间 → 时间戳</h2>
      <label htmlFor="date-input" className={label}>
        DATETIME
      </label>
      <input
        id="date-input"
        value={input}
        onChange={(e) => {
          setInput(e.target.value)
          setTouched(true)
        }}
        spellCheck={false}
        autoComplete="off"
        placeholder="2026-09-21 17:25:28"
        className={`${field} mt-2 w-full`}
      />
      <div className="mt-2 flex items-center gap-4">
        <span className="font-mono text-[11px] text-faint">
          未写时区的按所选时区理解
        </span>
        <button
          type="button"
          onClick={() => setInput(currentDateTime(tz))}
          className={`${action} ml-auto`}
        >
          填入当前
        </button>
      </div>

      {parsed && 'error' in parsed && <ErrorLine message={parsed.error} />}
      {parsed && !('error' in parsed) && (
        <Results>
          {UNITS.map((u) => (
            <ResultRow key={u.value} name={`${u.label}（${u.digits} 位）`} value={toUnit(parsed.ns, u.value)} />
          ))}
        </Results>
      )}
    </section>
  )
}

const BATCH_SAMPLE = `1789982744
1789982744123
2026-09-21 17:25:44
Mon, 21 Sep 2026 09:25:44 GMT`

function Batch({ tz }: { tz: string }) {
  const [input, setInput] = useState('')
  const [unit, setUnit] = useState<Unit>('s')
  const output = useMemo(() => convertLines(input, tz, unit), [input, tz, unit])

  const box =
    'h-[360px] w-full resize-none border border-line bg-raised p-4 font-mono text-[12.5px] leading-relaxed text-ink outline-none transition-colors placeholder:text-faint focus:border-brand'

  return (
    <div>
      <p className="m-0 mb-5 max-w-[46em] text-[13.5px] leading-relaxed text-muted">
        一行一个。纯数字按位数识别单位后转成日期，其余按日期转成时间戳，结果与输入逐行对齐，可以整列贴回表格。
      </p>
      <div className="grid gap-5 lg:grid-cols-2">
        <div>
          <div className="mb-2 flex items-center gap-3">
            <label htmlFor="batch-input" className={label}>
              INPUT
            </label>
            <button type="button" onClick={() => setInput(BATCH_SAMPLE)} className={`${action} ml-auto`}>
              填入示例
            </button>
            <button type="button" onClick={() => setInput('')} className={action}>
              清空
            </button>
          </div>
          <textarea
            id="batch-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            spellCheck={false}
            placeholder="每行一个时间戳或日期"
            className={box}
          />
        </div>
        <div>
          <div className="mb-2 flex items-center gap-3">
            <span className={label}>OUTPUT</span>
            <select
              aria-label="日期转出的时间戳单位"
              value={unit}
              onChange={(e) => setUnit(e.target.value as Unit)}
              className="ml-auto border-none bg-transparent font-mono text-[11px] text-muted outline-none"
            >
              {UNITS.map((u) => (
                <option key={u.value} value={u.value}>
                  日期转为{u.label}
                </option>
              ))}
            </select>
            <CopyButton value={output.trim() ? output : ''} />
          </div>
          <pre className={`${box} m-0 overflow-auto`}>
            {output.trim() ? output : <span className="text-faint">左侧输入后自动生成。</span>}
          </pre>
        </div>
      </div>
    </div>
  )
}

export function TimestampTool() {
  const [tab, setTab] = useState<'single' | 'batch'>('single')
  const [tz, setTz] = useState('Asia/Shanghai')
  const [zones, setZones] = useState(ZONES)
  const now = useNow(1000)

  // 默认跟随浏览器所在时区，不在常用列表里就补到最前
  useEffect(() => {
    const local = Intl.DateTimeFormat().resolvedOptions().timeZone
    if (!local) return
    setTz(local)
    if (!ZONES.some((z) => z.tz === local)) {
      setZones([{ tz: local, label: '本地' }, ...ZONES])
    }
  }, [])

  const tabClass = (active: boolean) =>
    `-mb-px border-b-2 px-1 pb-3 text-[14px] transition-colors ${
      active ? 'border-brand font-semibold text-ink' : 'border-transparent text-muted hover:text-ink'
    }`

  return (
    <div>
      <LiveClock />

      <div className="mb-8 flex flex-wrap items-end gap-x-6 gap-y-3 border-b border-line">
        <div role="tablist" className="flex gap-6">
          <button type="button" role="tab" aria-selected={tab === 'single'} onClick={() => setTab('single')} className={tabClass(tab === 'single')}>
            单个转换
          </button>
          <button type="button" role="tab" aria-selected={tab === 'batch'} onClick={() => setTab('batch')} className={tabClass(tab === 'batch')}>
            批量转换
          </button>
        </div>
        <div className="mb-2 flex w-full items-center gap-2 sm:ml-auto sm:w-auto">
          <label htmlFor="tz" className={label}>
            时区
          </label>
          <select
            id="tz"
            value={tz}
            onChange={(e) => setTz(e.target.value)}
            className="h-8 min-w-0 flex-1 border border-line bg-raised px-2 font-mono text-[12px] text-ink outline-none focus:border-brand sm:flex-none"
          >
            {zones.map((z) => (
              <option key={z.tz} value={z.tz}>
                {z.tz} · {z.label}
                {now === null ? '' : ` ${formatOffset(zoneOffset(now, z.tz))}`}
              </option>
            ))}
          </select>
        </div>
      </div>

      {tab === 'single' ? (
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-10">
          <TimestampToDate tz={tz} now={now} />
          <DateToTimestamp tz={tz} />
        </div>
      ) : (
        <Batch tz={tz} />
      )}
    </div>
  )
}
