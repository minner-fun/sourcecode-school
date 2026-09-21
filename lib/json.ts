/**
 * JSON 解析、序列化与取值路径。
 *
 * 不用 JSON.parse：接口里 19 位的 ID 写成数字时，JSON.parse 会悄悄改掉末几位，
 * 抓包对照签名原文时这是致命的。这里自己做递归下降解析，数字保留原文，
 * 顺带拿到出错的行列号和能看懂的中文报错。全部在浏览器端跑。
 */

export type JsonNode =
  | { kind: 'object'; entries: [string, JsonNode][] }
  | { kind: 'array'; items: JsonNode[] }
  | { kind: 'string'; value: string }
  | { kind: 'number'; raw: string }
  | { kind: 'boolean'; value: boolean }
  | { kind: 'null' }

export class JsonSyntaxError extends Error {
  readonly offset: number
  readonly line: number
  readonly column: number

  constructor(message: string, offset: number, line: number, column: number) {
    super(message)
    this.offset = offset
    this.line = line
    this.column = column
  }
}

const NUMBER = /-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/y
const ESCAPES: Record<string, string> = {
  '"': '"',
  '\\': '\\',
  '/': '/',
  b: '\b',
  f: '\f',
  n: '\n',
  r: '\r',
  t: '\t',
}

function describeChar(ch: string | undefined): string {
  if (ch === undefined) return '内容提前结束'
  if (ch === "'") return '遇到单引号，JSON 的字符串和键都必须用双引号'
  return `意外的字符 ${JSON.stringify(ch)}`
}

/** 超过这个深度基本是数据本身有问题，继续递归只会把浏览器的调用栈耗尽 */
const MAX_DEPTH = 1000

export function parse(text: string): JsonNode {
  let i = 0
  let depth = 0

  function fail(message: string, at = i): never {
    const before = text.slice(0, at)
    const line = before.split('\n').length
    const column = at - before.lastIndexOf('\n')
    throw new JsonSyntaxError(message, at, line, column)
  }

  function skipSpace() {
    while (i < text.length) {
      const c = text.charCodeAt(i)
      if (c === 32 || c === 9 || c === 10 || c === 13) i++
      else break
    }
  }

  function parseString(): string {
    // 调用时 text[i] 是开头的双引号
    const start = i++
    let out = ''
    let chunk = i
    while (true) {
      if (i >= text.length) fail('字符串没有闭合，缺少结尾的双引号', start)
      const ch = text[i]
      if (ch === '"') {
        out += text.slice(chunk, i)
        i++
        return out
      }
      if (ch === '\\') {
        out += text.slice(chunk, i)
        const esc = text[i + 1]
        if (esc === 'u') {
          const hex = text.slice(i + 2, i + 6)
          if (!/^[0-9a-fA-F]{4}$/.test(hex)) fail('\\u 后面必须是 4 位十六进制数')
          out += String.fromCharCode(parseInt(hex, 16))
          i += 6
        } else if (esc !== undefined && esc in ESCAPES) {
          out += ESCAPES[esc]
          i += 2
        } else {
          fail(`无效的转义 \\${esc ?? ''}`)
        }
        chunk = i
        continue
      }
      if (ch.charCodeAt(0) < 0x20) {
        fail(ch === '\n' ? '字符串里有未转义的换行，要写成 \\n' : '字符串里有未转义的控制字符')
      }
      i++
    }
  }

  function parseObject(): JsonNode {
    i++
    const entries: [string, JsonNode][] = []
    skipSpace()
    if (text[i] === '}') {
      i++
      return { kind: 'object', entries }
    }
    // 记住上一个逗号的位置，尾逗号报错时指向逗号本身而不是后面的 }
    let comma = i
    while (true) {
      skipSpace()
      if (text[i] === '}') fail('} 前面多了一个逗号', comma)
      if (text[i] !== '"') {
        fail(
          text[i] === "'" ? describeChar("'") :
          text[i] === undefined ? '对象没有闭合，缺少 }' :
          '键必须是双引号括起来的字符串',
        )
      }
      const key = parseString()
      skipSpace()
      if (text[i] !== ':') fail('键后面缺少冒号')
      i++
      entries.push([key, parseValue()])
      skipSpace()
      if (text[i] === ',') {
        comma = i++
        continue
      }
      if (text[i] === '}') {
        i++
        return { kind: 'object', entries }
      }
      fail(text[i] === undefined ? '对象没有闭合，缺少 }' : '缺少逗号，或者少了 }')
    }
  }

  function parseArray(): JsonNode {
    i++
    const items: JsonNode[] = []
    skipSpace()
    if (text[i] === ']') {
      i++
      return { kind: 'array', items }
    }
    let comma = i
    while (true) {
      skipSpace()
      if (text[i] === ']') fail('] 前面多了一个逗号', comma)
      items.push(parseValue())
      skipSpace()
      if (text[i] === ',') {
        comma = i++
        continue
      }
      if (text[i] === ']') {
        i++
        return { kind: 'array', items }
      }
      fail(text[i] === undefined ? '数组没有闭合，缺少 ]' : '缺少逗号，或者少了 ]')
    }
  }

  function parseValue(): JsonNode {
    skipSpace()
    const ch = text[i]

    if (ch === '{' || ch === '[') {
      if (++depth > MAX_DEPTH) fail(`嵌套超过 ${MAX_DEPTH} 层，不像是正常数据`)
      const node = ch === '{' ? parseObject() : parseArray()
      depth--
      return node
    }

    if (ch === '"') return { kind: 'string', value: parseString() }

    if (ch === '-' || (ch !== undefined && ch >= '0' && ch <= '9')) {
      NUMBER.lastIndex = i
      const m = NUMBER.exec(text)
      if (!m) fail('数字格式不对')
      if (/^-?0\d/.test(text.slice(i, i + m[0].length + 1))) fail('数字不能以 0 开头')
      i += m[0].length
      return { kind: 'number', raw: m[0] }
    }

    for (const [word, node] of [
      ['true', { kind: 'boolean', value: true }],
      ['false', { kind: 'boolean', value: false }],
      ['null', { kind: 'null' }],
    ] as const) {
      if (text.startsWith(word, i)) {
        i += word.length
        return node
      }
    }

    if (/[A-Za-z_$]/.test(ch ?? '')) {
      const word = /[\w$]+/y
      word.lastIndex = i
      const name = word.exec(text)?.[0] ?? ''
      if (name === 'undefined' || name === 'NaN' || name === 'Infinity') {
        fail(`${name} 不是合法的 JSON 值`)
      }
    }
    fail(describeChar(ch))
  }

  const root = parseValue()
  skipSpace()
  if (i < text.length) fail('JSON 已经结束，后面还有多余的内容')
  return root
}

export type Loaded = {
  root: JsonNode
  /** 自动做过的预处理，展示给读者，免得以为原文就是这样 */
  notes: string[]
}

/**
 * 解析前后的容错：去 BOM、剥 JSONP 外壳、还原被转义过的 JSON 字符串。
 * 只做确定无歧义的变换，单引号、注释、尾逗号这类仍然报错，让读者知道原文不合法。
 */
/** 去掉开头的 BOM（0xFEFF）：Windows 记事本存的 UTF-8 文件常带这个 */
export function stripBom(text: string): string {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text
}

export function load(input: string): Loaded {
  let text = stripBom(input).trim()
  const notes: string[] = []

  const jsonp = /^([A-Za-z_$][\w$.]*)\s*\(([\s\S]*)\)\s*;?$/.exec(text)
  if (jsonp && /^\s*[[{]/.test(jsonp[2])) {
    text = jsonp[2].trim()
    notes.push(`已去掉 JSONP 回调 ${jsonp[1]}(…)`)
  }

  let root: JsonNode
  try {
    root = parse(text)
  } catch (error) {
    // 日志里常见 {\"a\":1} 这种去掉了外层引号的转义 JSON，补上引号再试一次
    if (/^\{\\"|^\[\\"|^\[\{\\"/.test(text)) {
      try {
        root = parse(`"${text}"`)
      } catch {
        throw error
      }
    } else {
      throw error
    }
  }

  for (let depth = 0; depth < 3 && root.kind === 'string'; depth++) {
    const inner = root.value.trim()
    if (!/^[[{]/.test(inner)) break
    try {
      root = parse(inner)
    } catch {
      break
    }
    notes.push(depth === 0 ? '输入是转义过的 JSON 字符串，已自动还原' : `又还原了一层转义（共 ${depth + 1} 层）`)
  }

  return { root, notes }
}

export type FormatOptions = {
  /** null 表示压缩成一行 */
  indent: string | null
  asciiOnly: boolean
}

function quote(value: string, asciiOnly: boolean): string {
  const json = JSON.stringify(value)
  // 与 Python json.dumps 默认的 ensure_ascii=True 一致，方便对照签名原文
  return asciiOnly
    ? json.replace(/[^\x00-\x7f]/g, (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, '0')}`)
    : json
}

export function stringify(root: JsonNode, options: FormatOptions): string {
  const { indent, asciiOnly } = options
  const out: string[] = []

  function write(node: JsonNode, pad: string) {
    switch (node.kind) {
      case 'string':
        out.push(quote(node.value, asciiOnly))
        return
      case 'number':
        out.push(node.raw)
        return
      case 'boolean':
        out.push(String(node.value))
        return
      case 'null':
        out.push('null')
        return
    }

    const [open, close] = node.kind === 'object' ? ['{', '}'] : ['[', ']']
    const size = node.kind === 'object' ? node.entries.length : node.items.length
    if (size === 0) {
      out.push(open + close)
      return
    }

    const inner = indent === null ? '' : pad + indent
    out.push(open)
    for (let k = 0; k < size; k++) {
      if (k > 0) out.push(',')
      if (indent !== null) out.push('\n', inner)
      if (node.kind === 'object') {
        const [key, value] = node.entries[k]
        out.push(quote(key, asciiOnly), indent === null ? ':' : ': ')
        write(value, inner)
      } else {
        write(node.items[k], inner)
      }
    }
    if (indent !== null) out.push('\n', pad)
    out.push(close)
  }

  write(root, '')
  return out.join('')
}

/** 递归按键名排序，数组顺序不动 */
export function sortKeys(node: JsonNode): JsonNode {
  if (node.kind === 'object') {
    return {
      kind: 'object',
      entries: node.entries
        .map(([k, v]) => [k, sortKeys(v)] as [string, JsonNode])
        .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)),
    }
  }
  if (node.kind === 'array') return { kind: 'array', items: node.items.map(sortKeys) }
  return node
}

export function stats(root: JsonNode): { nodes: number; depth: number } {
  let nodes = 0
  let depth = 0
  const stack: [JsonNode, number][] = [[root, 1]]
  while (stack.length) {
    const [node, d] = stack.pop()!
    nodes++
    if (d > depth) depth = d
    if (node.kind === 'object') for (const [, v] of node.entries) stack.push([v, d + 1])
    else if (node.kind === 'array') for (const v of node.items) stack.push([v, d + 1])
  }
  return { nodes, depth }
}

export type Path = (string | number)[]

const IDENTIFIER = /^[A-Za-z_$][\w$]*$/

/** data.list[0]["content-type"] */
export function jsPath(path: Path): string {
  return path
    .map((seg, k) =>
      typeof seg === 'number'
        ? `[${seg}]`
        : IDENTIFIER.test(seg)
          ? (k === 0 ? seg : `.${seg}`)
          : `[${JSON.stringify(seg)}]`,
    )
    .join('')
}

/** ['data']['list'][0]['content-type'] */
export function pythonPath(path: Path): string {
  return path
    .map((seg) =>
      typeof seg === 'number'
        ? `[${seg}]`
        : `['${seg.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}']`,
    )
    .join('')
}
