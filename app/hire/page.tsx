import type { Metadata } from 'next'
import Image from 'next/image'
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
      <section className="border-b border-line">
        <div className="mx-auto flex max-w-[1080px] flex-col items-start gap-8 px-5 py-14 sm:px-8 md:flex-row md:items-center md:gap-12">
          <div className="flex-1">
            <div className="tag-line mb-5">About · Freelance</div>
            <h1 className="display m-0 mb-5 max-w-[15em] text-[28px] sm:text-[36px]">
              数据采集与分析，长期承接
            </h1>
            <p className="m-0 max-w-[38em] text-[15px] leading-[1.85] text-muted">
              {site.author.bio}
              需求提供目标平台、字段范围与数据量后即可评估，无法承接的会直接说明。
            </p>
          </div>
          <Image
            src={site.author.avatar}
            alt={site.author.name}
            width={128}
            height={128}
            priority
            className="size-32 shrink-0 rounded border border-line"
          />
        </div>
      </section>

      <div className="mx-auto max-w-[1080px] px-5 py-12 sm:px-8">
        {/* 服务项之间是并列关系，用发丝线分隔而不是编号 */}
        <SectionTitle>能做什么</SectionTitle>
        <div className="mb-14 grid divide-y divide-line border-b border-line sm:grid-cols-2 sm:divide-y-0 sm:[&>*:nth-child(-n+2)]:border-b sm:[&>*:nth-child(odd)]:border-r sm:[&>*]:border-line">
          {services.map((s) => (
            <div key={s.title} className="px-0 py-5 sm:px-6 sm:[&:nth-child(odd)]:pl-0">
              <h3 className="m-0 mb-2 text-[16px] font-semibold leading-snug text-ink">
                {s.title}
              </h3>
              <p className="m-0 text-[13.5px] leading-relaxed text-muted">
                {s.desc}
              </p>
            </div>
          ))}
        </div>

        <div className="grid items-start gap-12 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-16">
          <div>
            {/* 这里编号是真实顺序：一步做完才有下一步 */}
            <SectionTitle>合作流程</SectionTitle>
            {steps.map((s) => (
              <div
                key={s.no}
                className="grid grid-cols-[36px_minmax(0,1fr)] gap-4 border-b border-line py-4"
              >
                <div className="font-mono text-[13px] font-semibold tabular-nums text-brand">
                  {s.no}
                </div>
                <div>
                  <div className="mb-1.5 text-[15px] font-semibold text-ink">
                    {s.title}
                  </div>
                  <p className="m-0 max-w-[42em] text-[13.5px] leading-relaxed text-muted">
                    {s.desc}
                  </p>
                </div>
              </div>
            ))}

            <div className="mt-12">
              <SectionTitle>不承接的需求</SectionTitle>
              <ul className="m-0 list-none p-0">
                {declined.map((d) => (
                  <li
                    key={d}
                    className="flex gap-3 border-b border-line py-3 text-[14px] leading-relaxed text-muted"
                  >
                    <span className="font-mono text-[13px] text-fail">×</span>
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <aside className="border-t-2 border-brand bg-surface p-5 lg:sticky lg:top-24">
            <div className="tag-line mb-3">Start here</div>
            <p className="m-0 mb-4 text-[13.5px] leading-relaxed text-muted">
              填写后我会在一天内回复，也可以直接加微信。
            </p>
            <InquiryForm />
            <div className="my-5 h-px bg-line" />
            <dl className="flex flex-col gap-2 font-mono text-[12px]">
              <div className="flex justify-between gap-3">
                <dt className="text-faint">WECHAT</dt>
                <dd className="text-ink">{site.contacts.wechat}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-faint">EMAIL</dt>
                <dd className="truncate text-ink">{site.contacts.email}</dd>
              </div>
            </dl>
          </aside>
        </div>
      </div>
    </>
  )
}
