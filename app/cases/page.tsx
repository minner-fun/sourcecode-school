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
    <div className="mx-auto max-w-[1160px] px-5 py-12 sm:px-8">
      <div className="mb-4 font-mono text-[11px] tracking-[0.14em] text-brand">
        CASES
      </div>
      <h1 className="m-0 mb-3 text-[30px] font-medium leading-tight tracking-tight sm:text-[34px]">
        已交付的项目
      </h1>
      <p className="m-0 mb-9 max-w-[42em] text-[15.5px] leading-relaxed text-muted">
        涉及客户信息的部分已做脱敏，只保留数据规模、周期与交付形式。
      </p>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {cases.map((k) => (
          <article
            key={k.title}
            className="flex flex-col overflow-hidden rounded-xl border border-line bg-surface"
          >
            <div className="grid aspect-[16/9] place-items-center border-b border-line bg-raised text-center font-mono text-[10px] leading-relaxed text-faint">
              项目截图待补
            </div>
            <div className="flex flex-1 flex-col gap-3 p-5">
              <div className="flex items-center gap-2.5">
                <span className="rounded border border-brand-edge px-1.5 py-0.5 text-[10.5px] text-brand">
                  {k.kind}
                </span>
                <span className="ml-auto font-mono text-[11px] text-faint">
                  {k.year}
                </span>
              </div>
              <h2 className="m-0 text-[17px] font-medium leading-snug text-ink">
                {k.title}
              </h2>
              <p className="m-0 flex-1 text-[13px] leading-relaxed text-muted">
                {k.desc}
              </p>
              <dl className="grid grid-cols-3 gap-2.5 border-t border-line pt-3">
                {[
                  ['数据量', k.volume],
                  ['周期', k.time],
                  ['交付', k.deliver],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="mb-1 font-mono text-[10px] text-faint">
                      {label}
                    </dt>
                    <dd className="text-[13px] text-ink">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
