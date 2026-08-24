import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-[1160px] flex-col items-start px-5 py-24 sm:px-8">
      <div className="mb-4 font-mono text-[11px] tracking-[0.14em] text-brand">
        404
      </div>
      <h1 className="m-0 mb-3 text-[30px] font-medium tracking-tight">
        这个地址没有内容
      </h1>
      <p className="m-0 mb-7 text-[15.5px] text-muted">
        可能是文章改名或者链接写错了。
      </p>
      <div className="flex gap-3">
        <Link
          href="/"
          className="rounded-lg border border-brand px-4 py-2 text-sm font-medium text-brand transition-colors hover:bg-brand-tint"
        >
          回到首页
        </Link>
        <Link
          href="/archive"
          className="rounded-lg border border-line px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-raised"
        >
          浏览归档
        </Link>
      </div>
    </div>
  )
}
