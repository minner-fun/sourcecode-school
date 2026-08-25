import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-[1080px] flex-col items-start px-5 py-24 sm:px-8">
      <div className="mb-5 flex items-baseline gap-3 border-l-2 border-brand pl-4">
        <span className="font-mono text-[28px] font-semibold tabular-nums text-brand">
          404
        </span>
        <span className="font-mono text-[13px] text-muted">not found</span>
      </div>
      <h1 className="display m-0 mb-4 text-[26px]">这个地址没有内容</h1>
      <p className="m-0 mb-8 text-[15px] text-muted">
        可能是文章改名或者链接写错了。
      </p>
      <div className="flex gap-3">
        <Link
          href="/"
          className="border border-brand px-4 py-2 font-mono text-[12.5px] font-medium text-brand transition-colors hover:bg-brand hover:text-bg"
        >
          回到首页
        </Link>
        <Link
          href="/archive"
          className="border border-line px-4 py-2 font-mono text-[12.5px] font-medium text-ink transition-colors hover:border-ink"
        >
          浏览归档
        </Link>
      </div>
    </div>
  )
}
