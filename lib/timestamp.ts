/**
 * 时间戳 ↔ 日期互转。
 *
 * 内部统一用纳秒 bigint 表示一个时刻：19 位纳秒时间戳超出了 Number 的
 * 安全整数范围，微秒乘到纳秒同样会超，用 number 算会悄悄丢掉末几位。
 * 时区换算只依赖 Intl，不引第三方库，全部在浏览器端跑。
 */

export type Unit = 's' | 'ms' | 'us' | 'ns'

export const UNITS: { value: Unit; label: string; digits: number }[] = [
  { value: 's', label: '秒', digits: 10 },
  { value: 'ms', label: '毫秒', digits: 13 },
  { value: 'us', label: '微秒', digits: 16 },
  { value: 'ns', label: '纳秒', digits: 19 },
]

const FACTOR: Record<Unit, bigint> = {
  s: 1_000_000_000n,
  ms: 1_000_000n,
  us: 1_000n,
  ns: 1n,
}

/** 常用时区。浏览器本地时区不在其中时，由页面在挂载后补进来 */
export const ZONES: { tz: string; label: string }[] = [
  { tz: 'Asia/Shanghai', label: '北京' },
  { tz: 'UTC', label: 'UTC' },
  { tz: 'Asia/Tokyo', label: '东京' },
  { tz: 'Asia/Singapore', label: '新加坡' },
  { tz: 'Asia/Kolkata', label: '印度' },
  { tz: 'Asia/Dubai', label: '迪拜' },
  { tz: 'Europe/Moscow', label: '莫斯科' },
  { tz: 'Europe/Berlin', label: '柏林' },
  { tz: 'Europe/London', label: '伦敦' },
  { tz: 'America/New_York', label: '纽约' },
  { tz: 'America/Chicago', label: '芝加哥' },
  { tz: 'America/Los_Angeles', label: '洛杉矶' },
  { tz: 'Australia/Sydney', label: '悉尼' },
]

/** Date 能表示的范围是 ±8.64e15 毫秒 */
const MAX_NS = 8_640_000_000_000_000_000_000n

// bigint 的 / 和 % 向零取整，负时间戳（1970 年以前）需要向下取整
function floorDiv(a: bigint, b: bigint): bigint {
  const q = a / b
  return a % b !== 0n && a < 0n !== b < 0n ? q - 1n : q
}

function mod(a: bigint, b: bigint): bigint {
  return a - floorDiv(a, b) * b
}

function pad(n: number, width = 2): string {
  return String(n).padStart(width, '0')
}

/**
 * 按整数部分位数猜单位：10 位秒、13 位毫秒、16 位微秒、19 位纳秒，
 * 取相邻两档的中点作分界，位数不标准的也能落到最近的一档。
 */
export function detectUnit(intDigits: number): Unit {
  if (intDigits <= 11) return 's'
  if (intDigits <= 14) return 'ms'
  if (intDigits <= 17) return 'us'
  return 'ns'
}

export type ParsedTimestamp = { ns: bigint; unit: Unit }
export type Failure = { error: string }

export function parseTimestamp(
  input: string,
  unit: Unit | 'auto',
): ParsedTimestamp | Failure | null {
  // 允许从日志、表格里带出来的千分位逗号和下划线
  const value = input.trim().replace(/[\s,_]/g, '')
  if (!value) return null

  const match = /^(-?)(\d+)(?:\.(\d+))?$/.exec(value)
  if (!match) return { error: '时间戳只能包含数字，可带负号和小数点。' }

  const [, sign, int, frac = ''] = match
  const resolved =
    unit === 'auto' ? detectUnit(int.replace(/^0+/, '').length || 1) : unit
  const factor = FACTOR[resolved]

  // 小数部分折算到纳秒，超出纳秒精度的位直接截掉
  const fracDigits = factor.toString().length - 1
  const fracNs = fracDigits
    ? BigInt((frac + '0'.repeat(fracDigits)).slice(0, fracDigits))
    : 0n

  let ns = BigInt(int) * factor + fracNs
  if (sign) ns = -ns
  if (ns > MAX_NS || ns < -MAX_NS) {
    return { error: '超出可表示的日期范围，检查一下单位是不是选错了。' }
  }
  return { ns, unit: resolved }
}

export function toUnit(ns: bigint, unit: Unit): string {
  return floorDiv(ns, FACTOR[unit]).toString()
}

type Wall = {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  second: number
  weekday: number
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const formatters = new Map<string, Intl.DateTimeFormat>()

function formatter(tz: string): Intl.DateTimeFormat {
  let f = formatters.get(tz)
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hourCycle: 'h23',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      weekday: 'short',
    })
    formatters.set(tz, f)
  }
  return f
}

/** 某个时刻在指定时区的墙上时间 */
function wallTime(ms: number, tz: string): Wall {
  const parts: Record<string, string> = {}
  for (const p of formatter(tz).formatToParts(ms)) parts[p.type] = p.value
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    // 个别引擎在 h23 下仍会把午夜输出成 24
    hour: Number(parts.hour) % 24,
    minute: Number(parts.minute),
    second: Number(parts.second),
    weekday: WEEKDAYS.indexOf(parts.weekday),
  }
}

/** Date.UTC 会把 0–99 年当成 1900 年代，这里绕开 */
function utcMs(
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0,
  second = 0,
): number {
  const date = new Date(Date.UTC(2000, month - 1, day, hour, minute, second))
  date.setUTCFullYear(year)
  return date.getTime()
}

/** 指定时区在某个时刻相对 UTC 的偏移，单位分钟，东八区为 480 */
export function zoneOffset(ms: number, tz: string): number {
  const w = wallTime(ms, tz)
  const asUtc = utcMs(w.year, w.month, w.day, w.hour, w.minute, w.second)
  return Math.round((asUtc - Math.floor(ms / 1000) * 1000) / 60_000)
}

export function formatOffset(minutes: number, prefix = 'UTC'): string {
  const sign = minutes < 0 ? '-' : '+'
  const abs = Math.abs(minutes)
  return `${prefix}${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`
}

function formatWall(w: Wall, separator: string): string {
  return (
    `${pad(w.year, 4)}-${pad(w.month)}-${pad(w.day)}` +
    `${separator}${pad(w.hour)}:${pad(w.minute)}:${pad(w.second)}`
  )
}

/** 秒以下的部分：按 3 位一组去掉末尾的零，整秒时为空 */
function fraction(ns: bigint): string {
  const digits = mod(ns, 1_000_000_000n).toString().padStart(9, '0')
  const trimmed = digits.replace(/(000)+$/, '')
  return trimmed ? `.${trimmed}` : ''
}

const WEEKDAY_ZH = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']

export type Described = {
  datetime: string
  iso: string
  utc: string
  weekday: string
  offset: string
  ms: number
}

export function describe(ns: bigint, tz: string): Described {
  const ms = Number(floorDiv(ns, 1_000_000n))
  const frac = fraction(ns)
  const wall = wallTime(ms, tz)
  const offset = zoneOffset(ms, tz)

  return {
    datetime: formatWall(wall, ' ') + frac,
    iso:
      formatWall(wall, 'T') +
      frac +
      (tz === 'UTC' ? 'Z' : formatOffset(offset, '')),
    utc: formatWall(wallTime(ms, 'UTC'), 'T') + frac + 'Z',
    weekday: WEEKDAY_ZH[wall.weekday] ?? '',
    offset: formatOffset(offset),
    ms,
  }
}

const relativeFormat = new Intl.RelativeTimeFormat('zh-CN', { numeric: 'auto' })
const STEPS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 365 * 86_400],
  ['month', 30 * 86_400],
  ['day', 86_400],
  ['hour', 3_600],
  ['minute', 60],
  ['second', 1],
]

export function relative(ms: number, now: number): string {
  const diff = (ms - now) / 1000
  for (const [unit, size] of STEPS) {
    if (Math.abs(diff) >= size || unit === 'second') {
      return relativeFormat.format(Math.trunc(diff / size), unit)
    }
  }
  return ''
}

// 2026-09-21 17:25:28、2026/9/21 17:25、2026年9月21日 17时25分28秒、
// 2026-09-21T17:25:28.123+08:00 都能认
const DATETIME =
  /^(\d{4})[-/.年](\d{1,2})[-/.月](\d{1,2})日?(?:(?:\s+|T)(\d{1,2})[:：时](\d{1,2})(?:[:：分](\d{1,2})秒?)?(?:\.(\d{1,9}))?)?\s*(Z|[+-]\d{2}(?::?\d{2})?)?$/i

function parseOffset(value: string): number {
  if (value.toUpperCase() === 'Z') return 0
  const sign = value[0] === '-' ? -1 : 1
  const digits = value.slice(1).replace(':', '')
  return sign * (Number(digits.slice(0, 2)) * 60 + Number(digits.slice(2) || 0))
}

export function parseDateTime(
  input: string,
  tz: string,
): { ns: bigint } | Failure | null {
  const value = input.trim()
  if (!value) return null

  const match = DATETIME.exec(value)
  if (!match) {
    // 抓包里常见的 HTTP Date 头（Mon, 21 Sep 2026 09:25:28 GMT）自带时区，交给 Date.parse
    if (/[a-z]/i.test(value)) {
      const ms = Date.parse(value)
      if (!Number.isNaN(ms)) return { ns: BigInt(ms) * 1_000_000n }
    }
    return { error: '没认出日期格式，试试 2026-09-21 17:25:28。' }
  }

  const [year, month, day, hour = 0, minute = 0, second = 0] = match
    .slice(1, 7)
    .map((v) => (v === undefined ? undefined : Number(v))) as number[]
  const daysInMonth = new Date(Date.UTC(2000, month, 0)).getUTCDate()
  const lastDay = month === 2 && !isLeap(year) ? 28 : daysInMonth
  if (
    month < 1 || month > 12 || day < 1 || day > lastDay ||
    hour > 23 || minute > 59 || second > 59
  ) {
    return { error: '日期或时间超出范围，检查一下月、日、时、分、秒。' }
  }

  const wall = utcMs(year, month, day, hour, minute, second)
  let ms: number
  if (match[8]) {
    ms = wall - parseOffset(match[8]) * 60_000
  } else {
    // 先按墙上时间的偏移猜一次，夏令时切换附近偏移会变，再校正一次
    const first = zoneOffset(wall, tz)
    ms = wall - first * 60_000
    const second = zoneOffset(ms, tz)
    if (second !== first) ms = wall - second * 60_000
  }

  const fracNs = BigInt((match[7] ?? '').padEnd(9, '0'))
  return { ns: BigInt(ms) * 1_000_000n + fracNs }
}

function isLeap(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
}

/**
 * 批量转换：逐行判断方向，纯数字当时间戳转日期，其余当日期转时间戳。
 * 输出与输入逐行对齐，方便整列贴回表格。
 */
export function convertLines(text: string, tz: string, unit: Unit): string {
  return text
    .split(/\r?\n/)
    .map((line) => {
      if (!line.trim()) return ''
      if (/^\s*-?[\d,_]+(\.\d+)?\s*$/.test(line)) {
        const parsed = parseTimestamp(line, 'auto')
        if (!parsed || 'error' in parsed) return '# 无法识别'
        return describe(parsed.ns, tz).datetime
      }
      const parsed = parseDateTime(line, tz)
      if (!parsed || 'error' in parsed) return '# 无法识别'
      return toUnit(parsed.ns, unit)
    })
    .join('\n')
}
