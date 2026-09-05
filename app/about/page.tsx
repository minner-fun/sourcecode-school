import type { Metadata } from 'next'
import Image from 'next/image'
import { site } from '@/lib/site'
import { categories } from '@/lib/site'

export const metadata: Metadata = {
  title: '关于',
  description: '关于这个站，以及联系方式。',
  alternates: { canonical: '/about' },
}

const channels = [
  { key: 'WECHAT', value: site.contacts.wechat, note: '备注来意' },
  { key: 'EMAIL', value: site.contacts.email, note: '' },
  { key: 'GITHUB', value: site.contacts.github, note: '开源代码与工具' },
].filter((c) => c.value)

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-[1080px] px-5 py-12 sm:px-8">
      <div className="tag-line mb-4">About</div>
      <h1 className="display m-0 mb-8 text-[28px] sm:text-[34px]">关于</h1>

      <div className="grid items-start gap-12 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div className="max-w-[42em]">
          <div className="mb-7 flex items-start gap-5">
            <Image
              src={site.author.avatar}
              alt={site.author.name}
              width={72}
              height={72}
              priority
              className="size-18 shrink-0 rounded border border-line"
            />
            <div>
              <div className="mb-1.5 font-mono text-[15px] font-semibold text-ink">
                {site.author.name}
              </div>
              <p className="m-0 text-[14px] leading-relaxed text-muted">
                {site.author.bio}
              </p>
            </div>
          </div>

          <div className="prose">
            <h2>这个站写什么</h2>
            <p>
              日常工作里遇到的问题和解决过程，写下来主要是给自己留一份可检索的记录。
              内容分三条线：
            </p>
            <ul>
              {categories.map((c) => (
                <li key={c.slug}>
                  <strong>{c.label}</strong>——{c.description}
                </li>
              ))}
            </ul>

            <h2>写作原则</h2>
            <p>
              只写自己验证过的内容。代码尽量给到能直接跑的最小可复现版本，
              跑不通的思路会写明是思路而不是结论。文章里的接口、参数、盐值一律做过处理，
              不指向具体平台的真实线上环境。
            </p>

            <h2>边界</h2>
            <p>
              这里的技术内容仅供学习交流。涉及个人隐私数据、账号密码，
              以及目标方明确禁止的采集行为，站内不写也不讨论具体实现。
              取数之前先确认目标数据是否公开、是否在对方允许的范围内，
              这一步比技术方案更重要。
            </p>
          </div>
        </div>

        <aside className="lg:sticky lg:top-24">
          <div className="tag-line mb-3.5 border-b border-line pb-2 text-faint">
            Contact
          </div>
          <dl className="m-0 mb-5">
            {channels.map((ch) => (
              <div key={ch.key} className="border-b border-line py-3">
                <dt className="tag-line mb-1.5 text-faint">{ch.key}</dt>
                <dd className="m-0 break-all font-mono text-[13px] text-ink">
                  {ch.value}
                </dd>
                {ch.note ? (
                  <dd className="m-0 mt-1 text-[12px] text-muted">{ch.note}</dd>
                ) : null}
              </div>
            ))}
          </dl>

          {/* 二维码必须保持浅色底才扫得出来，深色模式下也不反转 */}
          <Image
            src="/wechat-qr.png"
            alt={`微信二维码，扫码添加 ${site.author.name}`}
            width={720}
            height={720}
            className="w-full border border-line bg-white"
          />
          <p className="m-0 mt-2.5 text-center font-mono text-[11px] text-faint">
            技术问题可以直接问
          </p>
        </aside>
      </div>
    </div>
  )
}
