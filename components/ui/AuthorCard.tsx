import Link from 'next/link'
import { site } from '@/lib/site'

export function AuthorCard() {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-brand-edge bg-brand-wash p-5 sm:flex-row sm:gap-5">
      <div className="grid size-14 shrink-0 place-items-center rounded-xl border border-dashed border-line text-center font-mono text-[9px] leading-tight text-faint">
        头像
        <br />
        占位
      </div>
      <div className="flex-1">
        <div className="mb-1.5 text-base font-medium text-ink">
          关于 {site.author.name}
        </div>
        <p className="mb-3.5 text-[13.5px] leading-relaxed text-muted">
          {site.author.bio}
        </p>
        <div className="flex flex-wrap gap-2.5">
          <Link
            href="/hire"
            className="rounded-lg border border-brand px-3.5 py-1.5 text-[13px] font-medium text-brand transition-colors hover:bg-brand-tint"
          >
            查看服务
          </Link>
          <Link
            href="/contact"
            className="rounded-lg border border-line px-3.5 py-1.5 text-[13px] font-medium text-ink transition-colors hover:bg-raised"
          >
            联系方式
          </Link>
        </div>
      </div>
    </div>
  )
}
