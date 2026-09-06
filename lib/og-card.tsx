import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { site } from './site'

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

/** 标题越长字号越小，保证三行以内放得下。 */
function titleSize(title: string): number {
  const n = [...title].length
  if (n <= 18) return 72
  if (n <= 30) return 62
  if (n <= 44) return 54
  return 46
}

export function ogCard(opts: { title: string; kicker?: string; footer?: string }) {
  const { title, kicker, footer } = opts
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, #0b1220 0%, #111a2e 60%, #16213a 100%)',
          color: '#e8edf5',
          padding: '64px 72px',
          fontFamily: 'Noto Sans SC',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ display: 'flex', width: 14, height: 14, borderRadius: 7, background: '#4fd1c5' }} />
            <div style={{ display: 'flex', fontSize: 30, fontWeight: 600, letterSpacing: 1 }}>{site.name}</div>
          </div>
          {kicker && (
            <div
              style={{
                display: 'flex',
                fontSize: 24,
                color: '#9fb0c8',
                padding: '8px 18px',
                borderRadius: 999,
                border: '1.5px solid #2b3a55',
              }}
            >
              {kicker}
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

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', fontSize: 26, color: '#9fb0c8' }}>{footer ?? site.tagline}</div>
          <div style={{ display: 'flex', fontSize: 26, color: '#4fd1c5', letterSpacing: 2 }}>{site.domain}</div>
        </div>
      </div>
    ),
    {
      ...OG_SIZE,
      fonts: [{ name: 'Noto Sans SC', data: font, style: 'normal', weight: 400 }],
    },
  )
}
