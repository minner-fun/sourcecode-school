/**
 * 公众号草稿箱 API。
 *
 * 只写到草稿箱，不发布 —— 群发不可逆且每天有次数上限，那一步留给人在后台点。
 *
 * 两个环境约束，缺一个都会 40164（IP 不在白名单）：
 *   1. 必须走 IPv4。本机直连默认解析到 IPv6，而微信白名单只收 IPv4。
 *   2. 必须绕开代理。走 clash 时出口是境外节点，和白名单里的地址对不上。
 *      Node 的 fetch 本来就不读 HTTP_PROXY，这条实测确认过，无需额外处理。
 */
import dns from 'node:dns'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

// 放在模块顶层：任何一次 fetch 之前就得生效
dns.setDefaultResultOrder('ipv4first')

const BASE = 'https://api.weixin.qq.com/cgi-bin'
const CRED_FILE = path.join(os.homedir(), '.config', 'wechat-mp.env')

type Cred = { appId: string; secret: string }
let cred: Cred | null = null

/** 凭据只从家目录下的文件读，不进仓库、不写日志。 */
async function credentials(): Promise<Cred> {
  if (cred) return cred
  let raw: string
  try {
    raw = await fs.readFile(CRED_FILE, 'utf8')
  } catch {
    throw new Error(`读不到 ${CRED_FILE} —— 公众号凭据没配好`)
  }
  const get = (k: string) =>
    raw.match(new RegExp(`^${k}\\s*=\\s*(.+)$`, 'm'))?.[1].trim().replace(/^["']|["']$/g, '')
  const appId = get('APP_ID')
  const secret = get('APP_SECRET')
  if (!appId || !secret) throw new Error(`${CRED_FILE} 里缺 APP_ID 或 APP_SECRET`)
  cred = { appId, secret }
  return cred
}

let token: { value: string; expiresAt: number } | null = null

/**
 * access_token 有效期 7200s，且**全局唯一** —— 再取一次会让上一个立刻失效。
 * 所以进程内缓存，并提前 5 分钟过期，避免边界上拿着刚失效的 token 去调。
 */
async function accessToken(): Promise<string> {
  if (token && Date.now() < token.expiresAt) return token.value
  const { appId, secret } = await credentials()
  const url = `${BASE}/token?grant_type=client_credential&appid=${appId}&secret=${secret}`
  const d = (await (await fetch(url, { signal: AbortSignal.timeout(20_000) })).json()) as {
    access_token?: string
    expires_in?: number
    errcode?: number
    errmsg?: string
  }
  if (!d.access_token) {
    throw new Error(`取 access_token 失败：${d.errcode} ${d.errmsg}${
      d.errcode === 40164 ? '（当前出口 IP 不在白名单，或请求走了 IPv6 / 代理）' : ''
    }`)
  }
  token = {
    value: d.access_token,
    expiresAt: Date.now() + ((d.expires_in ?? 7200) - 300) * 1000,
  }
  return token.value
}

/** 微信的错误码走 HTTP 200 返回，必须看 body 而不是状态码。 */
function assertOk(d: Record<string, unknown>, what: string): void {
  const code = d.errcode as number | undefined
  if (code !== undefined && code !== 0) {
    throw new Error(`${what} 失败：${code} ${d.errmsg}`)
  }
}

/** endpoint 可能自带查询串（如 material/add_material?type=image），拼接符要跟着变。 */
function withToken(endpoint: string, t: string): string {
  return `${BASE}/${endpoint}${endpoint.includes('?') ? '&' : '?'}access_token=${t}`
}

async function postJson<T>(endpoint: string, body: unknown, what: string): Promise<T> {
  const t = await accessToken()
  const res = await fetch(withToken(endpoint, t), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    // 微信不接受 \u 转义的中文，必须发原始 UTF-8
    body: Buffer.from(JSON.stringify(body), 'utf8'),
    signal: AbortSignal.timeout(60_000),
  })
  const d = (await res.json()) as Record<string, unknown>
  assertOk(d, what)
  return d as T
}

async function postFile<T>(
  endpoint: string,
  filePath: string,
  what: string,
  extra: Record<string, string> = {},
): Promise<T> {
  const t = await accessToken()
  const buf = await fs.readFile(filePath)
  const name = path.basename(filePath)
  const type = name.endsWith('.png') ? 'image/png' : 'image/jpeg'
  const form = new FormData()
  form.append('media', new Blob([new Uint8Array(buf)], { type }), name)
  for (const [k, v] of Object.entries(extra)) form.append(k, v)
  const res = await fetch(withToken(endpoint, t), {
    method: 'POST',
    body: form,
    signal: AbortSignal.timeout(120_000),
  })
  const d = (await res.json()) as Record<string, unknown>
  assertOk(d, what)
  return d as T
}

/**
 * 正文里用的图片。返回的是 mp.weixin.qq.com 的地址，只能用在图文正文里。
 * 不占用永久素材配额，但单张不得超过 1MB。
 */
export async function uploadContentImage(filePath: string): Promise<string> {
  const { size } = await fs.stat(filePath)
  if (size > 1024 * 1024) {
    throw new Error(`${path.basename(filePath)} 有 ${(size / 1024 / 1024).toFixed(2)}MB，正文图上限 1MB`)
  }
  const d = await postFile<{ url: string }>('media/uploadimg', filePath, '上传正文图片')
  return d.url
}

/** 封面图。必须是永久素材，draft/add 的 thumb_media_id 要的就是它。 */
export async function uploadThumb(filePath: string): Promise<string> {
  const d = await postFile<{ media_id: string }>(
    'material/add_material?type=image',
    filePath,
    '上传封面素材',
  )
  return d.media_id
}

export interface DraftArticle {
  title: string
  author?: string
  digest?: string
  content: string
  content_source_url?: string
  thumb_media_id: string
  need_open_comment?: 0 | 1
  only_fans_can_comment?: 0 | 1
}

export async function addDraft(article: DraftArticle): Promise<string> {
  const d = await postJson<{ media_id: string }>('draft/add', { articles: [article] }, '新增草稿')
  return d.media_id
}

export async function draftCount(): Promise<number> {
  const t = await accessToken()
  const res = await fetch(withToken('draft/count', t), {
    signal: AbortSignal.timeout(20_000),
  })
  const d = (await res.json()) as Record<string, unknown>
  assertOk(d, '查草稿数量')
  return d.total_count as number
}
