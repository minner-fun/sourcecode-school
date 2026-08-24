import Link from 'next/link'
import { site } from '@/lib/site'

/**
 * 侧栏接单卡。全站的转化入口只保留两处：这里和文末作者卡。
 * 顶部横幅、导航里再放一次会让第一次来的技术读者直接判成营销号。
 */
export function HireCard() {
  return (
    <div className="rounded-2xl border border-brand-edge bg-brand-wash p-5">
      <div className="mb-3 font-mono text-[10px] tracking-[0.14em] text-brand">
        AVAILABLE FOR WORK
      </div>
      <div className="mb-2.5 text-[17px] font-medium leading-snug text-ink">
        数据采集与分析，可承接
      </div>
      <p className="mb-4 text-[13px] leading-relaxed text-muted">
        自媒体平台数据采集、电商平台商品详情数据，以及配套的数据分析报告。说明目标平台与字段范围即可评估。
      </p>
      <dl className="mb-4 flex flex-col gap-2 text-[13px]">
        <div className="flex justify-between">
          <dt className="text-faint">微信</dt>
          <dd className="font-mono">{site.contacts.wechat}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-faint">邮箱</dt>
          <dd className="font-mono">{site.contacts.email}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-faint">响应</dt>
          <dd>通常一天内</dd>
        </div>
      </dl>
      <Link
        href="/hire"
        className="block rounded-lg border border-brand py-2.5 text-center text-sm font-medium text-brand transition-colors hover:bg-brand-tint"
      >
        说明需求
      </Link>
    </div>
  )
}
