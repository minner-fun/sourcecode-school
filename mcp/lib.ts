/**
 * MCP 服务器的共享层：路径解析、站点契约读取、校验、git 操作。
 *
 * 关键设计：校验规则不在这里重写，一律复用站点自己的 lib/posts.ts 与 lib/site.ts。
 * 那四条会让 Vercel 构建直接失败的校验（缺字段 / 栏目错 / 日期非法 / slug 重复）
 * 必须和站点完全一致，写两份迟早脱节。Node 24 能直接导入 .ts，所以直接引。
 */
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const exec = promisify(execFile)

/**
 * 站点仓库根目录。默认取本文件的上一级（mcp/ 就在仓库里），
 * 也允许用 SITE_REPO 覆盖，方便写作项目从别处指过来。
 */
export const REPO =
  process.env.SITE_REPO ??
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

export const POSTS_DIR = path.join(REPO, 'content', 'posts')

/*
 * 切到站点仓库。lib/posts.ts 用 `path.join(process.cwd(), 'content', 'posts')`
 * 定位内容目录——这对 Next 是对的（构建在仓库根跑），但 MCP 服务器是被
 * 写作项目的客户端拉起的，cwd 是那个项目的目录。
 *
 * 不切的话，写入走 REPO（对）、读取走 cwd（错），后果是：
 *   - validate 永远报「解析通过，共 0 篇」，等于没校验
 *   - publish_post 的「写入后仍未被解析到」检查会让每次发布都中止
 *
 * 本进程只服务这一个仓库，chdir 是安全的；git 调用本来就显式带 cwd，不受影响。
 */
process.chdir(REPO)

/*
 * lib/posts.ts 只在 NODE_ENV=development 时绕过模块级缓存。
 * MCP 是长驻进程、内容目录一直在变，必须绕过，否则读到的永远是启动那一刻的快照。
 */
// Next 的类型把 NODE_ENV 标成只读——在应用代码里确实不该改，
// 但这里是独立的 CLI 进程，设置它是正确做法，所以显式断言绕开
;(process.env as Record<string, string | undefined>).NODE_ENV ??= 'development'

type SiteModule = typeof import('../lib/site.ts')
type PostsModule = typeof import('../lib/posts.ts')

export async function site(): Promise<SiteModule> {
  return import(path.join(REPO, 'lib', 'site.ts'))
}

export async function posts(): Promise<PostsModule> {
  return import(path.join(REPO, 'lib', 'posts.ts'))
}

/* ------------------------------------------------------------------ *
 * 校验
 * ------------------------------------------------------------------ */

/** slug 是 URL 的一部分，发布后不能再改，所以格式必须严格 */
export function checkSlug(slug: string): string[] {
  const errors: string[] = []
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
    errors.push(
      `slug "${slug}" 格式不合法：只能是小写字母、数字和单个连字符，如 sign-md5-reverse`,
    )
  }
  if (slug.length < 3) errors.push('slug 太短，至少 3 个字符')
  if (slug.length > 60) errors.push('slug 过长，建议 60 字符以内')
  return errors
}

/**
 * 经营性措辞扫描。
 *
 * 站点走个人 ICP 备案，个人主体不得含经营性内容——服务报价、接单入口、
 * 付费服务都可能被判定为经营性，导致驳回或事后注销。
 * 这条检查是为了守住那个约束，命中不阻断发布，但必须提示。
 */
const COMMERCIAL =
  /接单|承接|报价|收费|付费|下单|购买|服务项目|合作流程|套餐|计价|商城/g

export function scanCommercial(text: string): string[] {
  return [...new Set(text.match(COMMERCIAL) ?? [])]
}

/** 跑一遍站点自己的解析器，把构建时才会炸的问题提前暴露出来 */
export async function validateAll(): Promise<
  { ok: true; count: number } | { ok: false; error: string }
> {
  try {
    const m = await posts()
    return { ok: true, count: m.getAllPosts().length }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) }
  }
}

/* ------------------------------------------------------------------ *
 * frontmatter
 * ------------------------------------------------------------------ */

/** YAML 标量：含特殊字符时才加引号，保持文件可读 */
function yamlValue(v: string): string {
  if (/^[\w一-鿿][^:#'"\n]*$/.test(v) && !/:\s/.test(v)) return v
  return `'${v.replace(/'/g, "''")}'`
}

export type Frontmatter = {
  title: string
  date: string
  category: string
  excerpt: string
  tags?: string[]
  cover?: string
  series?: string
  seriesTitle?: string
  seriesOrder?: number
  draft?: boolean
}

export function buildFrontmatter(fm: Frontmatter): string {
  const lines = [
    `title: ${yamlValue(fm.title)}`,
    `date: ${fm.date}`,
    `category: ${fm.category}`,
    `tags: [${(fm.tags ?? []).map(yamlValue).join(', ')}]`,
    `excerpt: ${yamlValue(fm.excerpt)}`,
  ]
  if (fm.cover) lines.push(`cover: ${fm.cover}`)
  if (fm.series) lines.push(`series: ${fm.series}`)
  if (fm.seriesTitle) lines.push(`seriesTitle: ${yamlValue(fm.seriesTitle)}`)
  if (fm.seriesOrder !== undefined) lines.push(`seriesOrder: ${fm.seriesOrder}`)
  lines.push(`draft: ${fm.draft ?? true}`)
  return `---\n${lines.join('\n')}\n---\n`
}

export function postPath(slug: string): string {
  return path.join(POSTS_DIR, `${slug}.mdx`)
}

export async function exists(p: string): Promise<boolean> {
  return fs.access(p).then(() => true, () => false)
}

/** 今天的日期，按东八区取——作者在国内，用 UTC 会在深夜写作时差一天 */
export function today(): string {
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Shanghai' })
}

/* ------------------------------------------------------------------ *
 * git
 * ------------------------------------------------------------------ */

export async function git(...args: string[]): Promise<string> {
  const { stdout } = await exec('git', args, { cwd: REPO, maxBuffer: 8 << 20 })
  return stdout.trim()
}

/**
 * 提交前确认暂存区是干净的。
 *
 * 直接 commit 会把别人已经暂存的改动一起带上——发一篇文章顺手提交了
 * 半截代码，事后很难拆开。宁可报错让人自己处理。
 */
export async function stagedFiles(): Promise<string[]> {
  const out = await git('diff', '--cached', '--name-only')
  return out ? out.split('\n').filter(Boolean) : []
}

export async function currentBranch(): Promise<string> {
  return git('rev-parse', '--abbrev-ref', 'HEAD')
}
