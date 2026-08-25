import type { Metadata } from 'next'
import Image from 'next/image'
import { site } from '@/lib/site'

export const metadata: Metadata = {
  title: '联系方式',
  description: '微信最快，其余渠道也会看。技术问题可以直接问。',
  alternates: { canonical: '/contact' },
}

const channels = [
  { key: 'WECHAT', value: site.contacts.wechat, note: '最快，备注来意' },
  { key: 'EMAIL', value: site.contacts.email, note: '正式需求走邮件' },
  { key: 'QQ', value: site.contacts.qq, note: '常在线' },
  { key: 'TELEGRAM', value: site.contacts.telegram, note: '海外客户' },
  { key: 'GITHUB', value: site.contacts.github, note: '开源代码与工具' },
].filter((c) => c.value)

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-[1080px] px-5 py-12 sm:px-8">
      <div className="tag-line mb-4">Contact</div>
      <h1 className="display m-0 mb-4 text-[28px] sm:text-[34px]">联系方式</h1>
      <p className="m-0 mb-10 max-w-[38em] text-[15px] leading-[1.85] text-muted">
        微信最快，其余渠道也会看。技术问题可以直接问，能答的都会答。
      </p>

      <div className="grid items-start gap-12 lg:grid-cols-[minmax(0,1fr)_240px]">
        <dl className="m-0 border-t border-ink">
          {channels.map((ch) => (
            <div
              key={ch.key}
              className="grid grid-cols-[86px_minmax(0,1fr)] items-baseline gap-x-5 gap-y-1 border-b border-line py-4"
            >
              <dt className="tag-line text-faint">{ch.key}</dt>
              <dd className="m-0">
                <div className="break-all font-mono text-[14px] font-medium text-ink">
                  {ch.value}
                </div>
                <div className="mt-1 text-[12.5px] text-muted">{ch.note}</div>
              </dd>
            </div>
          ))}
        </dl>

        <div>
          {/* 二维码必须保持浅色底才扫得出来，深色模式下也不反转 */}
          <Image
            src="/wechat-qr.png"
            alt="微信二维码，扫码添加 Minner"
            width={720}
            height={720}
            className="w-full border border-line bg-white"
          />
          <p className="m-0 mt-3 text-center font-mono text-[11.5px] text-faint">
            扫码添加，备注来意
          </p>
        </div>
      </div>
    </div>
  )
}
