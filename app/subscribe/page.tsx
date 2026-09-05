import type { Metadata } from 'next'
import Image from 'next/image'
import { site, siteUrl } from '@/lib/site'
import { CopyableUrl } from '@/components/ui/CopyableUrl'

export const metadata: Metadata = {
  title: '订阅',
  description: `新文章会同步发到微信公众号「${site.wechatMp.name}」，也提供 RSS。`,
  alternates: { canonical: '/subscribe' },
}

export default function SubscribePage() {
  const feed = `${siteUrl}/feed.xml`

  return (
    <div className="mx-auto max-w-[1080px] px-5 py-12 sm:px-8">
      <div className="tag-line mb-4">Subscribe</div>
      <h1 className="display m-0 mb-4 text-[28px] sm:text-[34px]">订阅</h1>
      <p className="m-0 mb-10 max-w-[38em] text-[15px] leading-[1.85] text-muted">
        新文章会同步发到公众号。两个渠道挑一个就行，内容一样。
      </p>

      <div className="grid gap-px bg-line md:grid-cols-2">
        {/* 公众号放主位：国内读者的订阅行为基本都在微信里 */}
        <section className="border-t-2 border-brand bg-bg p-6">
          <div className="tag-line mb-3 text-faint">微信公众号</div>
          <div className="mb-4 font-mono text-[19px] font-semibold text-ink">
            {site.wechatMp.name}
          </div>

          {site.wechatMp.qr ? (
            <>
              {/* 二维码要浅底才扫得出来，深色模式下也不反转 */}
              <Image
                src={site.wechatMp.qr}
                alt={`微信公众号 ${site.wechatMp.name} 的二维码`}
                width={640}
                height={640}
                className="mb-3 w-full max-w-[220px] border border-line bg-white"
              />
              <p className="m-0 text-[13px] leading-relaxed text-muted">
                微信扫码关注，或在微信里搜「{site.wechatMp.name}」。
              </p>
            </>
          ) : (
            <p className="m-0 text-[13.5px] leading-relaxed text-muted">
              打开微信 → 搜索「{site.wechatMp.name}」→ 关注。
              更新会直接推到你的订阅号列表里。
            </p>
          )}
        </section>

        <section className="border-t-2 border-line bg-bg p-6">
          <div className="tag-line mb-3 text-faint">RSS</div>
          <div className="mb-4 font-mono text-[19px] font-semibold text-ink">
            feed.xml
          </div>

          <div className="mb-4">
            <CopyableUrl url={feed} />
          </div>

          <p className="m-0 text-[13.5px] leading-relaxed text-muted">
            把上面的地址复制到 RSS 阅读器里（Feedly、Inoreader、NetNewsWire
            之类），站点更新后阅读器会自动拉到新文章。
          </p>
          <p className="m-0 mt-3 text-[12.5px] leading-relaxed text-faint">
            直接在浏览器里打开这个地址会看到一堆 XML，那是给阅读器解析用的，不是给人读的。
          </p>
        </section>
      </div>
    </div>
  )
}
