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
    <div className="mx-auto max-w-[1160px] px-5 py-12 sm:px-8">
      <div className="mb-4 font-mono text-[11px] tracking-[0.14em] text-brand">
        CONTACT
      </div>
      <h1 className="m-0 mb-3 text-[30px] font-medium leading-tight tracking-tight sm:text-[34px]">
        联系方式
      </h1>
      <p className="m-0 mb-9 max-w-[40em] text-[15.5px] leading-relaxed text-muted">
        微信最快，其余渠道也会看。技术问题可以直接问，能答的都会答。
      </p>

      <div className="grid items-start gap-12 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div className="grid gap-3.5 sm:grid-cols-2">
          {channels.map((ch) => (
            <div
              key={ch.key}
              className="flex flex-col gap-1.5 rounded-xl border border-line bg-surface p-4"
            >
              <span className="font-mono text-[10px] tracking-[0.12em] text-brand">
                {ch.key}
              </span>
              <span className="break-all font-mono text-[15px] font-medium text-ink">
                {ch.value}
              </span>
              <span className="text-[12.5px] text-faint">{ch.note}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-col items-center gap-3 rounded-xl border border-line bg-surface p-4">
          {/* 二维码必须保持浅色底才扫得出来，深色模式下也不反转 */}
          <Image
            src="/wechat-qr.png"
            alt="微信二维码，扫码添加 Minner"
            width={720}
            height={720}
            className="w-full rounded-lg border border-line bg-white"
          />
          <p className="m-0 text-center text-[12.5px] text-muted">
            扫码添加，备注来意
          </p>
        </div>
      </div>
    </div>
  )
}
