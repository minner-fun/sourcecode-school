import { OG_SIZE, ogCard } from '@/lib/og-card'
import { site } from '@/lib/site'

export const alt = `${site.name} · ${site.tagline}`
export const size = OG_SIZE
export const contentType = 'image/png'

/** 首页及所有没有自己分享图的页面共用。 */
export default async function Image() {
  return ogCard({ title: site.tagline, footer: '采集逆向 · 源码剖析 · 工程实践' })
}
