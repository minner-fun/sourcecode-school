import type { Metadata } from 'next'
import { cases } from '@/lib/business'

export const metadata: Metadata = {
  title: '案例',
  description:
    '已交付的采集、数据工程与分析项目。涉及客户信息的部分已脱敏，只保留数据规模、周期与交付形式。',
  alternates: { canonical: '/cases' },
}

export default function CasesPage() {
  return (
    <div className="mx-auto max-w-[1080px] px-5 py-12 sm:px-8">
      <div className="tag-line mb-4">Cases</div>
      <h1 className="display m-0 mb-4 text-[28px] sm:text-[34px]">
        已交付的项目
      </h1>
      <p className="m-0 mb-10 max-w-[40em] text-[15px] leading-[1.85] text-muted">
        涉及客户信息的部分已做脱敏，只保留数据规模、周期与交付形式。
      </p>

      {/* 案例的可信度来自数字，所以数据本身排成对齐的等宽表，而不是配图卡片 */}
      <div className="border-t border-ink">
        {cases.map((k) => (
          <article
            key={k.title}
            className="grid gap-x-8 gap-y-4 border-b border-line py-6 lg:grid-cols-[minmax(0,1fr)_300px]"
          >
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-3">
                <span className="rounded border border-brand-edge px-1.5 py-0.5 font-mono text-[10px] font-medium tracking-[0.06em] text-brand">
                  {k.kind}
                </span>
                <span className="rail">{k.year}</span>
              </div>
              <h2 className="m-0 mb-2 text-[17px] font-semibold leading-snug text-ink">
                {k.title}
              </h2>
              <p className="m-0 max-w-[40em] text-[13.5px] leading-relaxed text-muted">
                {k.desc}
              </p>
            </div>

            <dl className="grid grid-cols-3 gap-4 self-start border-l border-line pl-6 lg:pl-8">
              {[
                ['数据量', k.volume],
                ['周期', k.time],
                ['交付', k.deliver],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="tag-line mb-1.5 text-faint">{label}</dt>
                  <dd className="m-0 font-mono text-[13px] font-medium tabular-nums text-ink">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </article>
        ))}
      </div>
    </div>
  )
}
