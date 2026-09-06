import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { categoryMap, site, type CategorySlug } from './site'

/**
 * 分享图（Open Graph / Twitter card）的统一模板。
 *
 * 文章不配封面也要有一张像样的预览图：微信、知乎、X、Telegram 展开链接时
 * 有图和没图的点击率差得很远。这里按标题动态生成，作者写文不必配图；
 * 以后哪篇想用自己的封面，frontmatter 加 cover 即可（页面元数据已支持）。
 *
 * 中文必须显式提供字体：Satori 内置字体只有拉丁字符。字体在模块级只读一次；
 * 用 process.cwd() 拼字面量路径，Next 的文件追踪才会把它打进 Vercel 函数包。
 */

export const OG_SIZE = { width: 1200, height: 630 }

const font = await readFile(join(process.cwd(), 'assets/NotoSansSC-subset.otf'))

/**
 * 取站点深色模式的调色板。
 *
 * 分享图在 satori 里渲染，读不到 CSS 变量，只能写死值——所以这里的每一个
 * 都必须和 app/globals.css 的 --d-* 对应，改配色时两处一起改。
 * 卡片走深色而不是站点默认的浅色：分享卡片出现在微信、知乎的白色信息流里，
 * 深色更跳得出来，而且深色模式本来就是站点自己的一套皮，不算另起炉灶。
 */
const C = {
  bg: '#101215',      // --d-bg
  ink: '#e8e5df',     // --d-ink
  muted: '#9aa0a8',   // --d-muted
  line: '#2a2e34',    // --d-line
  brand: '#e39a4a',   // --d-brand
  alt: '#6fa9b6',     // --d-alt
} as const

/**
 * 栏目色沿用站点徽章的三档。只用在徽章上——
 * 顶栏、品牌方块、域名一律用赭石，不随栏目变。
 * 分享卡出现在信息流里，被人一眼认出是谁比标明栏目重要得多；
 * 让中性色的栏目把整张卡带灰，等于每三篇里有一篇不带品牌。
 */
const CATEGORY_COLOR: Record<CategorySlug, string> = {
  reverse: C.brand,
  teardown: C.alt,
  engineering: C.muted,
}

/** 标题越长字号越小，保证三行以内放得下。 */
function titleSize(title: string): number {
  const n = [...title].length
  if (n <= 18) return 72
  if (n <= 30) return 62
  if (n <= 44) return 54
  return 46
}

export function ogCard(opts: {
  title: string
  category?: CategorySlug
  footer?: string
}) {
  const { title, category, footer } = opts
  const badge = category ? CATEGORY_COLOR[category] : C.brand

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: C.bg,
          color: C.ink,
          fontFamily: 'Noto Sans SC',
        }}
      >
        {/* 顶边赭石横杠：站点所有重点卡片都是这个语言（border-t-2 border-brand） */}
        <div style={{ display: 'flex', height: 10, background: C.brand }} />

        <div
          style={{
            display: 'flex',
            flex: 1,
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '58px 72px 64px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              {/* 方块而非圆点，与导航栏的品牌标一致 */}
              <div style={{ display: 'flex', width: 16, height: 16, background: C.brand }} />
              <div style={{ display: 'flex', fontSize: 30, fontWeight: 600 }}>
                {site.name}
              </div>
            </div>
            {category && (
              <div
                style={{
                  display: 'flex',
                  fontSize: 24,
                  color: badge,
                  padding: '8px 18px',
                  borderRadius: 6,
                  border: `1.5px solid ${badge}`,
                }}
              >
                {categoryMap[category].label}
              </div>
            )}
          </div>

          <div
            style={{
              display: 'flex',
              fontSize: titleSize(title),
              fontWeight: 700,
              lineHeight: 1.3,
              letterSpacing: 0.5,
              maxWidth: 1040,
            }}
          >
            {title}
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderTop: `1px solid ${C.line}`,
              paddingTop: 26,
            }}
          >
            <div style={{ display: 'flex', fontSize: 26, color: C.muted }}>
              {footer ?? site.tagline}
            </div>
            <div style={{ display: 'flex', fontSize: 26, color: C.brand, letterSpacing: 1 }}>
              {site.domain}
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...OG_SIZE,
      fonts: [{ name: 'Noto Sans SC', data: font, style: 'normal', weight: 400 }],
    },
  )
}
