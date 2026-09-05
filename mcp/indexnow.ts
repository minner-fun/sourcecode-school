/**
 * IndexNow：发布后主动把新 URL 推给 Bing / Yandex 等同协议引擎。
 *
 * 为什么放在 MCP 而不是站点里：站点是全静态的，构建完就没有运行时了，
 * 没有"部署完成"这个钩子。而 MCP 恰好知道刚发的是哪一篇、什么时候推的。
 *
 * 为什么必须先等页面上线：协议要求提交的 URL 当时就能取到。
 * push 之后 Vercel 还要构建几十秒，这期间去推，引擎抓到的是 404 ——
 * 比不推更糟，因为它会把这个 URL 记成坏的。
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import { REPO, site } from './lib.ts'

const ENDPOINT = 'https://api.indexnow.org/indexnow'

export type PingResult =
  | { ok: true; urls: string[]; status: number }
  | { ok: false; reason: string; urls?: string[] }

/**
 * 密钥自检：lib/site.ts 里的值必须和 public/<key>.txt 的内容一致。
 * 两处任意一处改了而另一处没跟上，推送会被引擎拒掉且不好排查，
 * 所以宁可发布前先自己发现。
 */
async function verifyKey(key: string): Promise<string | null> {
  if (!/^[A-Za-z0-9-]{8,128}$/.test(key)) {
    return `密钥格式不合法（协议要求 8-128 位字母数字或连字符）：${key}`
  }
  const file = path.join(REPO, 'public', `${key}.txt`)
  let content: string
  try {
    content = await fs.readFile(file, 'utf8')
  } catch {
    return `缺少密钥文件 public/${key}.txt —— 所有权校验会失败`
  }
  if (content.trim() !== key) {
    return `public/${key}.txt 的内容与 lib/site.ts 里的密钥不一致`
  }
  return null
}

/** 轮询直到页面真的能取到。返回是否等到了。 */
export async function waitLive(
  url: string,
  { timeoutMs = 150_000, intervalMs = 10_000 } = {},
): Promise<{ live: boolean; waitedMs: number; lastStatus: number }> {
  const t0 = Date.now()
  let lastStatus = 0
  while (Date.now() - t0 < timeoutMs) {
    try {
      const res = await fetch(url, {
        method: 'HEAD',
        redirect: 'manual',
        signal: AbortSignal.timeout(10_000),
      })
      lastStatus = res.status
      if (res.status === 200) return { live: true, waitedMs: Date.now() - t0, lastStatus }
    } catch {
      lastStatus = 0
    }
    await new Promise((r) => setTimeout(r, intervalMs))
  }
  return { live: false, waitedMs: Date.now() - t0, lastStatus }
}

/**
 * 一篇文章发布后值得推送的地址：文章本身，加上内容因它而变的列表页。
 * 标签页没有列进来 —— 一篇文章能带出好几个标签页，价值又低，
 * 交给 sitemap 常规抓取就够了。
 */
export async function urlsForPost(
  slug: string,
  post: { category?: string; series?: string },
): Promise<string[]> {
  const { site: cfg } = await site()
  const base = `https://${cfg.domain}`
  const urls = [`${base}/posts/${slug}`, `${base}/`, `${base}/archive`]
  if (post.category) urls.push(`${base}/category/${post.category}`)
  if (post.series) urls.push(`${base}/series/${post.series}`)
  return urls
}

export async function ping(urls: string[]): Promise<PingResult> {
  const { site: cfg } = await site()
  const key = (cfg as { indexNowKey?: string }).indexNowKey
  if (!key) return { ok: false, reason: 'lib/site.ts 里没有配置 indexNowKey' }

  const bad = await verifyKey(key)
  if (bad) return { ok: false, reason: bad }

  const host = cfg.domain
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        host,
        key,
        keyLocation: `https://${host}/${key}.txt`,
        urlList: urls,
      }),
      signal: AbortSignal.timeout(15_000),
    })
    // 200 = 已接受，202 = 已收到待校验。其余都当失败报出来。
    if (res.status === 200 || res.status === 202) {
      return { ok: true, urls, status: res.status }
    }
    return { ok: false, reason: `接口返回 ${res.status} ${res.statusText}`, urls }
  } catch (e) {
    return { ok: false, reason: e instanceof Error ? e.message : String(e), urls }
  }
}
