import type { Metadata } from 'next'
import { services, steps, declined } from '@/lib/business'
import { site } from '@/lib/site'
import { InquiryForm } from '@/components/ui/InquiryForm'
import { SectionTitle } from '@/components/ui/SectionTitle'

export const metadata: Metadata = {
  title: '关于与接单',
  description:
    '承接自媒体与电商平台的数据采集、接口协议还原、数据管道开发与分析报告。说明目标平台与字段范围即可评估。',
  alternates: { canonical: '/hire' },
}

export default function HirePage() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-line">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-36 -top-72 size-[640px] rounded-full"
          style={{
            background:
              'radial-gradient(circle, var(--brand-tint), transparent 68%)',
          }}
        />
        <div className="relative mx-auto flex max-w-[1160px] flex-col items-start gap-8 px-5 py-12 sm:px-8 sm:py-14 md:flex-row md:items-center md:gap-11">
          <div className="flex-1">
            <div className="mb-4 font-mono text-[11px] tracking-[0.14em] text-brand">
              ABOUT · FREELANCE
            </div>
            <h1 className="m-0 mb-3.5 max-w-[16em] text-[30px] font-medium leading-tight tracking-tight sm:text-[36px]">
              数据采集与分析，长期承接
            </h1>
            <p className="m-0 max-w-[40em] text-[15.5px] leading-relaxed text-muted">
              {site.author.bio}
              需求提供目标平台、字段范围与数据量后即可评估，无法承接的会直接说明。
            </p>
          </div>
          <div className="grid size-[132px] shrink-0 place-items-center rounded-2xl border border-dashed border-line text-center font-mono text-[10px] leading-relaxed text-faint">
            头像占位
            <br />
            400 × 400
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1160px] px-5 py-11 sm:px-8">
        <div className="mb-12 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {services.map((s) => (
            <div
              key={s.no}
              className="flex flex-col gap-2 rounded-xl border border-line bg-surface p-5"
            >
              <div className="font-mono text-[10px] tracking-[0.12em] text-brand">
                {s.no}
              </div>
              <div className="text-[16.5px] font-medium leading-snug text-ink">
                {s.title}
              </div>
              <p className="m-0 text-[13px] leading-relaxed text-muted">
                {s.desc}
              </p>
            </div>
          ))}
        </div>

        <div className="grid items-start gap-12 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-14">
          <div>
            <SectionTitle>合作流程</SectionTitle>
            {steps.map((s) => (
              <div
                key={s.no}
                className="grid grid-cols-[48px_minmax(0,1fr)] gap-5 border-b border-line py-4"
              >
                <div className="font-mono text-[26px] font-medium text-brand-tint">
                  {s.no}
                </div>
                <div>
                  <div className="mb-1.5 text-base font-medium text-ink">
                    {s.title}
                  </div>
                  <p className="m-0 max-w-[44em] text-[13.5px] leading-relaxed text-muted">
                    {s.desc}
                  </p>
                </div>
              </div>
            ))}

            <div className="mt-10">
              <SectionTitle>不承接的需求</SectionTitle>
              <ul className="m-0 list-disc pl-5 text-sm leading-loose text-muted">
                {declined.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
            </div>
          </div>

          <aside className="rounded-2xl border border-brand-edge bg-brand-wash p-5 lg:sticky lg:top-24">
            <div className="mb-2 text-lg font-medium text-ink">说明需求</div>
            <p className="m-0 mb-4 text-[13px] leading-relaxed text-muted">
              填写后我会在一天内回复，也可以直接加微信。
            </p>
            <InquiryForm />
            <div className="my-5 h-px bg-line" />
            <dl className="flex flex-col gap-2.5 text-[13px]">
              <div className="flex justify-between">
                <dt className="text-faint">微信</dt>
                <dd className="font-mono">{site.contacts.wechat}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-faint">邮箱</dt>
                <dd className="font-mono">{site.contacts.email}</dd>
              </div>
            </dl>
          </aside>
        </div>
      </div>
    </>
  )
}
