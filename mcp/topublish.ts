/**
 * 把一篇已发布的文章送进公众号草稿箱。
 *
 * 流水线：复用站点自己的导出脚本转 HTML → 正文里的本地图片逐张传到微信、
 * 换成 mp.weixin.qq.com 的地址 → 生成封面并传成永久素材 → 建草稿。
 *
 * 只到草稿箱。群发不可逆、每天有次数上限，那一步留给人在后台点。
 */
import { execFile } from 'node:child_process'
import fs from 'node:fs/promises'
import path from 'node:path'
import { promisify } from 'node:util'
import matter from 'gray-matter'
import os from 'node:os'
import { REPO, PUBLIC_DIR, site, postPath, exists } from './lib.ts'
import { addDraft, uploadContentImage, uploadThumb } from './wechat.ts'

const exec = promisify(execFile)

export interface DraftResult {
  mediaId: string
  title: string
  images: { local: string; remote: string }[]
  sourceUrl: string
  coverBytes: number
  htmlBytes: number
}

/**
 * 正文里的站内图片换成微信地址。
 * 外链图片微信会直接剥掉，所以本地图片必须先传过去 —— 这是唯一的办法。
 */
async function swapImages(
  html: string,
): Promise<{ html: string; images: { local: string; remote: string }[] }> {
  const refs = [...new Set([...html.matchAll(/src="(\/[^"]+)"/g)].map((m) => m[1]))]
  const images: { local: string; remote: string }[] = []
  let out = html
  for (const ref of refs) {
    const abs = path.resolve(PUBLIC_DIR, '.' + ref.split(/[?#]/)[0])
    if (!abs.startsWith(PUBLIC_DIR + path.sep) || !(await exists(abs))) continue
    const remote = await uploadContentImage(abs)
    out = out.replaceAll(`src="${ref}"`, `src="${remote}"`)
    images.push({ local: path.relative(REPO, abs), remote })
  }
  return { html: out, images }
}

export async function draftToWechat(
  slug: string,
  opts: { titleOverride?: string; author?: string } = {},
): Promise<DraftResult> {
  const file = postPath(slug)
  if (!(await exists(file))) throw new Error(`找不到 ${slug}.mdx`)
  const { data } = matter(await fs.readFile(file, 'utf8'))
  if (data.draft) throw new Error(`${slug} 还是草稿 —— 先在站点发布，再同步到公众号`)

  // 复用站点自己的导出脚本，转换规则只有一份，不在这里重写
  await exec('node', ['scripts/export-post.mjs', slug], { cwd: REPO, timeout: 180_000 })
  const exported = path.join(REPO, 'export-out', `${slug}.wechat.html`)
  if (!(await exists(exported))) throw new Error(`导出脚本没有产出 ${slug}.wechat.html`)

  const { html, images } = await swapImages(await fs.readFile(exported, 'utf8'))

  const { site: cfg } = await site()

  /*
   * 封面直接取站点自己生成的 OG 分享图（Next 的 opengraph-image 约定，
   * lib/og-card.tsx 按标题渲染 1200×630）。
   *
   * 不另做一套：站点已经有这张图了，再画一版意味着两处视觉要同步维护，
   * 迟早走样。1200×630 是 1.90:1，公众号列表按 2.35:1 居中裁 ——
   * 卡片上下留白足够，品牌行和页脚都在裁切范围内。
   */
  const ogUrl = `https://${cfg.domain}/posts/${slug}/opengraph-image`
  const res = await fetch(ogUrl, { signal: AbortSignal.timeout(60_000) })
  if (!res.ok) throw new Error(`取封面失败：${ogUrl} 返回 ${res.status}`)
  const coverBuf = Buffer.from(await res.arrayBuffer())
  if (coverBuf.length < 3000) {
    throw new Error(`封面只有 ${coverBuf.length} 字节，多半没渲染出来`)
  }
  const coverDir = await fs.mkdtemp(path.join(os.tmpdir(), 'mp-cover-'))
  const cover = path.join(coverDir, `${slug}.png`)
  await fs.writeFile(cover, coverBuf)
  const coverBytes = coverBuf.length
  const thumb = await uploadThumb(cover)
  await fs.rm(coverDir, { recursive: true, force: true })

  const sourceUrl = `https://${cfg.domain}/posts/${slug}`
  const mediaId = await addDraft({
    // 公众号标题上限 64 字，超了整条请求会被拒
    title: (opts.titleOverride ?? data.title).slice(0, 64),
    author: opts.author ?? cfg.name,
    digest: String(data.excerpt).slice(0, 120),
    content: html,
    content_source_url: sourceUrl,
    thumb_media_id: thumb,
    need_open_comment: 1,
  })

  return {
    mediaId,
    title: data.title,
    images,
    sourceUrl,
    coverBytes,
    htmlBytes: Buffer.byteLength(html, 'utf8'),
  }
}
