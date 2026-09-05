import Link from 'next/link'
import Image from 'next/image'
import { site } from '@/lib/site'

/** 侧栏的作者名片，取代原来的接单卡 */
export function AboutCard() {
  return (
    <div className="border-t-2 border-brand bg-surface p-4">
      <div className="mb-3 flex items-center gap-3">
        <Image
          src={site.author.avatar}
          alt={site.author.name}
          width={40}
          height={40}
          className="size-10 shrink-0 rounded border border-line"
        />
        <div className="font-mono text-[13px] font-semibold text-ink">
          {site.author.name}
        </div>
      </div>
      <p className="m-0 mb-3.5 text-[12.5px] leading-relaxed text-muted">
        {site.author.bio}
      </p>
      <Link
        href="/about"
        className="block border border-line py-1.5 text-center font-mono text-[11.5px] text-muted transition-colors hover:border-brand hover:text-brand"
      >
        关于与联系
      </Link>
    </div>
  )
}
