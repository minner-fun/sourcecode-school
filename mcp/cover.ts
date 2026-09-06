/**
 * 公众号封面图：用 headless Chrome 截本地模板。
 *
 * 为什么不用画图库：封面要和站点视觉一致（深色底、品牌绿、细网格、等宽字体），
 * 用 HTML+CSS 描述一次比在绘图 API 里堆坐标可维护得多，改配色只动模板。
 *
 * 尺寸 900×383 —— 公众号封面推荐的 2.35:1，列表页和分享卡片都按这个裁。
 */
import { execFile } from 'node:child_process'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'
import { fileURLToPath } from 'node:url'

const exec = promisify(execFile)
const HERE = path.dirname(fileURLToPath(import.meta.url))
const TEMPLATE = path.join(HERE, 'assets', 'cover.html')

const CHROME = ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser']

async function chromeBin(): Promise<string> {
  for (const b of CHROME) {
    try {
      await exec('which', [b])
      return b
    } catch {
      /* 试下一个 */
    }
  }
  throw new Error(`找不到 Chrome，试过：${CHROME.join(' / ')}`)
}

export interface CoverInput {
  title: string
  /** 栏目英文名，右上角那行小字 */
  kicker?: string
  /** 系列显示名，页脚 */
  series?: string
}

/** 生成封面并返回文件路径。调用方负责清理（放在临时目录里）。 */
export async function makeCover(input: CoverInput): Promise<string> {
  const q = new URLSearchParams({ title: input.title })
  if (input.kicker) q.set('kicker', input.kicker)
  if (input.series) q.set('series', input.series)

  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'mp-cover-'))
  const out = path.join(dir, 'cover.png')
  const bin = await chromeBin()

  await exec(bin, [
    '--headless',
    '--disable-gpu',
    '--no-sandbox',
    '--hide-scrollbars',
    // 默认字体在 headless 下可能挑不到中文，显式给一个确定存在的
    '--force-device-scale-factor=1',
    '--window-size=900,383',
    `--screenshot=${out}`,
    `file://${TEMPLATE}?${q.toString()}`,
  ], { timeout: 60_000 })

  const { size } = await fs.stat(out)
  if (size < 3000) throw new Error(`封面只有 ${size} 字节，多半渲染成了空白页`)
  return out
}
