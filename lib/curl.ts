/**
 * curl 命令 → Python requests 代码。
 *
 * 抓包工具复制出来的 curl 是采集工作的起点，手工翻译成 Python 既慢又容易漏 header。
 * 这里只做纯文本转换，不发任何请求，全部在浏览器端跑。
 */

export type ParsedCurl = {
  method: string
  url: string
  headers: Record<string, string>
  cookies: Record<string, string>
  data?: string
  /** --data-urlencode / -F 收集到的键值对 */
  form?: [string, string][]
  json?: unknown
  auth?: [string, string]
  proxy?: string
  insecure: boolean
}

/**
 * 按 shell 规则切词：处理反斜杠续行、单引号（内部不转义）、
 * 双引号（内部 \" 转义）。不求覆盖全部 shell 语法，覆盖抓包工具的输出即可。
 */
export function tokenize(input: string): string[] {
  const tokens: string[] = []
  let current = ''
  let started = false
  let quote: '"' | "'" | null = null

  for (let i = 0; i < input.length; i++) {
    const ch = input[i]

    if (quote === "'") {
      if (ch === "'") quote = null
      else current += ch
      continue
    }

    if (quote === '"') {
      if (ch === '\\' && i + 1 < input.length) {
        const next = input[i + 1]
        // 双引号内只有这几个字符会被转义，其余保留反斜杠本身
        current += '"\\$`\n'.includes(next) ? next : ch + next
        i++
      } else if (ch === '"') {
        quote = null
      } else {
        current += ch
      }
      continue
    }

    if (ch === "'" || ch === '"') {
      quote = ch
      started = true
      continue
    }

    if (ch === '\\' && i + 1 < input.length) {
      // 行尾反斜杠是续行，直接吃掉换行
      if (input[i + 1] === '\n' || input[i + 1] === '\r') {
        i += input[i + 1] === '\r' && input[i + 2] === '\n' ? 2 : 1
        continue
      }
      current += input[i + 1]
      started = true
      i++
      continue
    }

    if (/\s/.test(ch)) {
      if (started || current) {
        tokens.push(current)
        current = ''
        started = false
      }
      continue
    }

    current += ch
    started = true
  }

  if (started || current) tokens.push(current)
  return tokens
}

function splitOnce(value: string, sep: string): [string, string] {
  const at = value.indexOf(sep)
  return at === -1
    ? [value.trim(), '']
    : [value.slice(0, at).trim(), value.slice(at + sep.length).trim()]
}

export function parseCurl(input: string): ParsedCurl {
  const tokens = tokenize(input.trim())
  if (tokens[0] === 'curl') tokens.shift()

  const result: ParsedCurl = {
    method: '',
    url: '',
    headers: {},
    cookies: {},
    insecure: false,
  }
  const dataParts: string[] = []
  const form: [string, string][] = []

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]
    const next = () => tokens[++i] ?? ''

    switch (true) {
      case token === '-X' || token === '--request':
        result.method = next().toUpperCase()
        break

      case token === '-H' || token === '--header': {
        const [key, value] = splitOnce(next(), ':')
        if (!key) break
        if (key.toLowerCase() === 'cookie') {
          for (const pair of value.split(';')) {
            const [ck, cv] = splitOnce(pair, '=')
            if (ck) result.cookies[ck] = cv
          }
        } else {
          result.headers[key] = value
        }
        break
      }

      case token === '-b' || token === '--cookie': {
        for (const pair of next().split(';')) {
          const [ck, cv] = splitOnce(pair, '=')
          if (ck) result.cookies[ck] = cv
        }
        break
      }

      case /^--data(-raw|-binary|-ascii)?$/.test(token) || token === '-d':
        dataParts.push(next())
        break

      case token === '--data-urlencode': {
        const [key, value] = splitOnce(next(), '=')
        form.push([key, value])
        break
      }

      case token === '-F' || token === '--form': {
        const [key, value] = splitOnce(next(), '=')
        form.push([key, value])
        break
      }

      case token === '-u' || token === '--user': {
        const [user, pass] = splitOnce(next(), ':')
        result.auth = [user, pass]
        break
      }

      case token === '-A' || token === '--user-agent':
        result.headers['User-Agent'] = next()
        break

      case token === '-e' || token === '--referer':
        result.headers['Referer'] = next()
        break

      case token === '-x' || token === '--proxy':
        result.proxy = next()
        break

      case token === '--url':
        result.url = next()
        break

      case token === '-k' || token === '--insecure':
        result.insecure = true
        break

      // 这些对 requests 没有等价物或本来就是默认行为，直接忽略
      case /^(--compressed|-L|--location|-s|--silent|-i|--include|-v|--verbose|-g|--globoff|--http[\d.]+)$/.test(
        token,
      ):
        break

      default:
        if (!token.startsWith('-') && !result.url) result.url = token
        break
    }
  }

  if (dataParts.length > 0) result.data = dataParts.join('&')
  if (form.length > 0) result.form = form

  if (!result.method) {
    result.method = result.data || result.form ? 'POST' : 'GET'
  }

  // Content-Type 是 JSON 且 body 能解析，就用 json= 传，比 data= 更贴近实际写法
  const contentType = Object.entries(result.headers).find(
    ([k]) => k.toLowerCase() === 'content-type',
  )?.[1]
  if (result.data && contentType?.includes('json')) {
    try {
      result.json = JSON.parse(result.data)
    } catch {
      // body 不是合法 JSON 就退回 data=，不报错
    }
  }

  return result
}

function py(value: string): string {
  return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`
}

function pyValue(value: unknown, indent = 0): string {
  const pad = ' '.repeat(indent)
  if (value === null) return 'None'
  if (typeof value === 'boolean') return value ? 'True' : 'False'
  if (typeof value === 'number') return String(value)
  if (typeof value === 'string') return py(value)
  if (Array.isArray(value)) {
    if (value.length === 0) return '[]'
    const items = value
      .map((v) => `${pad}    ${pyValue(v, indent + 4)}`)
      .join(',\n')
    return `[\n${items},\n${pad}]`
  }
  const entries = Object.entries(value as Record<string, unknown>)
  if (entries.length === 0) return '{}'
  const items = entries
    .map(([k, v]) => `${pad}    ${py(k)}: ${pyValue(v, indent + 4)}`)
    .join(',\n')
  return `{\n${items},\n${pad}}`
}

function dictBlock(name: string, entries: [string, string][]): string {
  if (entries.length === 0) return ''
  const body = entries.map(([k, v]) => `    ${py(k)}: ${py(v)},`).join('\n')
  return `${name} = {\n${body}\n}\n\n`
}

export function toPython(parsed: ParsedCurl): string {
  // 各段自带结尾换行，最后统一折叠多余空行
  const lines: string[] = ['import requests\n\n']

  lines.push(
    dictBlock('headers', Object.entries(parsed.headers)),
    dictBlock('cookies', Object.entries(parsed.cookies)),
  )

  if (parsed.json !== undefined) {
    lines.push(`payload = ${pyValue(parsed.json)}\n\n`)
  } else if (parsed.form) {
    lines.push(dictBlock('payload', parsed.form))
  } else if (parsed.data) {
    lines.push(`payload = ${py(parsed.data)}\n\n`)
  }

  if (parsed.proxy) {
    lines.push(
      `proxies = {\n    'http': ${py(parsed.proxy)},\n    'https': ${py(
        parsed.proxy,
      )},\n}\n\n`,
    )
  }

  const args = [py(parsed.url)]
  if (Object.keys(parsed.headers).length > 0) args.push('headers=headers')
  if (Object.keys(parsed.cookies).length > 0) args.push('cookies=cookies')
  if (parsed.json !== undefined) args.push('json=payload')
  else if (parsed.form) args.push('data=payload')
  else if (parsed.data) args.push('data=payload')
  if (parsed.auth) args.push(`auth=(${py(parsed.auth[0])}, ${py(parsed.auth[1])})`)
  if (parsed.proxy) args.push('proxies=proxies')
  if (parsed.insecure) args.push('verify=False')
  args.push('timeout=15')

  const method = parsed.method.toLowerCase()
  const call =
    ['get', 'post', 'put', 'delete', 'patch', 'head', 'options'].includes(method)
      ? `requests.${method}(`
      : `requests.request(${py(parsed.method)}, `

  lines.push(
    `response = ${call}\n${args.map((a) => `    ${a},`).join('\n')}\n)\n\n`,
    'print(response.status_code)\nprint(response.text[:1000])\n',
  )

  return lines.join('').replace(/\n{3,}/g, '\n\n')
}

export function convert(input: string): { code: string; error?: string } {
  const trimmed = input.trim()
  if (!trimmed) return { code: '' }
  try {
    const parsed = parseCurl(trimmed)
    if (!parsed.url) {
      return { code: '', error: '没解析出 URL，确认粘贴的是完整的 curl 命令。' }
    }
    return { code: toPython(parsed) }
  } catch (error) {
    return {
      code: '',
      error: error instanceof Error ? error.message : '解析失败',
    }
  }
}
