import Link from 'next/link'
import Image from 'next/image'
import { site } from '@/lib/site'

export function AuthorCard() {
  return (
    <div className="flex flex-col gap-4 border-t-2 border-brand bg-surface p-5 sm:flex-row sm:gap-5">
      <Image
        src={site.author.avatar}
        alt={site.author.name}
        width={56}
        height={56}
        className="size-14 shrink-0 rounded border border-line"
      />
      <div className="flex-1">
        <div className="mb-2 font-mono text-[13px] font-semibold text-ink">
          {site.author.name}
        </div>
        <p className="m-0 mb-3.5 text-[13.5px] leading-relaxed text-muted">
          {site.author.bio}
        </p>
        <div className="flex flex-wrap gap-2.5">
          <Link
            href="/about"
            className="border border-line px-3.5 py-1.5 font-mono text-[12px] font-medium text-ink transition-colors hover:border-brand hover:text-brand"
          >
            关于与联系
          </Link>
          <Link
            href="/subscribe"
            className="border border-line px-3.5 py-1.5 font-mono text-[12px] font-medium text-ink transition-colors hover:border-brand hover:text-brand"
          >
            订阅更新
          </Link>
        </div>
      </div>
    </div>
  )
}
