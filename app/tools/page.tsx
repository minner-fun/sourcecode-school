import type { Metadata } from 'next'
import Link from 'next/link'
import { tools } from '@/lib/tools'

export const metadata: Metadata = {
  title: '工具',
  description:
    '数据采集与逆向分析里常用的小工具，全部在浏览器本地运行，不上传任何数据。',
  alternates: { canonical: '/tools' },
}

export default function ToolsPage() {
  return (
    <div className="mx-auto max-w-[1160px] px-5 py-12 sm:px-8">
      <div className="mb-4 font-mono text-[11px] tracking-[0.14em] text-brand">
        TOOLS
      </div>
      <h1 className="m-0 mb-3 text-[30px] font-medium leading-tight tracking-tight sm:text-[34px]">
        工具
      </h1>
      <p className="m-0 mb-9 max-w-[42em] text-[15.5px] leading-relaxed text-muted">
        日常抓包与调试里反复用到的几个小工具。全部在浏览器本地运行，粘进去的内容不会发到任何服务器。
      </p>

      <div className="grid gap-5 md:grid-cols-2">
        {tools.map((tool) => {
          const ready = tool.status === 'ready'
          const body = (
            <>
              <div className="flex items-center gap-2.5">
                <h2 className="m-0 text-[17px] font-medium leading-snug text-ink">
                  {tool.title}
                </h2>
                {!ready ? (
                  <span className="ml-auto shrink-0 rounded border border-line px-1.5 py-0.5 font-mono text-[10px] text-faint">
                    计划中
                  </span>
                ) : null}
              </div>
              <p className="m-0 text-[13px] leading-relaxed text-muted">
                {tool.desc}
              </p>
            </>
          )

          return ready ? (
            <Link
              key={tool.slug}
              href={`/tools/${tool.slug}`}
              className="flex flex-col gap-2.5 rounded-xl border border-line bg-surface p-5 transition-colors hover:border-brand-edge"
            >
              {body}
            </Link>
          ) : (
            <div
              key={tool.slug}
              className="flex flex-col gap-2.5 rounded-xl border border-dashed border-line p-5 opacity-70"
            >
              {body}
            </div>
          )
        })}
      </div>
    </div>
  )
}
