import Link from 'next/link'
import { site } from '@/lib/site'

/**
 * 侧栏接单卡。全站转化入口只有两处：这里和文末作者卡。
 * 不用色块背景，靠一条赭石顶边和等宽排版立住，避免整块变成广告位。
 */
export function HireCard() {
  return (
    <div className="border-t-2 border-brand bg-surface px-4 pb-4 pt-3.5">
      <div className="tag-line mb-3">Available for work</div>
      <p className="m-0 mb-4 text-[13.5px] leading-relaxed text-muted">
        自媒体与电商平台的数据采集、接口协议还原，以及配套的数据管道与分析报告。说明目标平台和字段范围即可评估。
      </p>
      <dl className="mb-4 flex flex-col gap-2 font-mono text-[12px]">
        <div className="flex justify-between gap-3">
          <dt className="text-faint">WECHAT</dt>
          <dd className="text-ink">{site.contacts.wechat}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-faint">EMAIL</dt>
          <dd className="truncate text-ink">{site.contacts.email}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-faint">REPLY</dt>
          <dd className="text-ink">通常一天内</dd>
        </div>
      </dl>
      <Link
        href="/hire"
        className="block border border-brand py-2 text-center font-mono text-[12.5px] font-medium text-brand transition-colors hover:bg-brand hover:text-bg"
      >
        说明需求
      </Link>
    </div>
  )
}
