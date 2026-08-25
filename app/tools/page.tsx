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
    <div className="mx-auto max-w-[1080px] px-5 py-12 sm:px-8">
      <div className="tag-line mb-4">Tools</div>
      <h1 className="display m-0 mb-4 text-[28px] sm:text-[34px]">工具</h1>
      <p className="m-0 mb-10 max-w-[40em] text-[15px] leading-[1.85] text-muted">
        日常抓包与调试里反复用到的几个小工具。全部在浏览器本地运行，粘进去的内容不会发到任何服务器。
      </p>

      <div className="border-t border-ink">
        {tools.map((tool) => {
          const ready = tool.status === 'ready'
          const body = (
            <>
              <div className="flex items-baseline gap-3">
                <h2
                  className={`m-0 text-[16px] font-semibold leading-snug ${ready ? 'text-ink' : 'text-muted'}`}
                >
                  {tool.title}
                </h2>
                <span className="rail ml-auto shrink-0">
                  {ready ? '可用' : '计划中'}
                </span>
              </div>
              <p className="m-0 mt-2 max-w-[46em] text-[13.5px] leading-relaxed text-muted">
                {tool.desc}
              </p>
            </>
          )

          return ready ? (
            <Link
              key={tool.slug}
              href={`/tools/${tool.slug}`}
              className="group block border-b border-line py-5 [&_h2]:decoration-brand-edge [&_h2]:underline-offset-[5px] group-hover:[&_h2]:underline"
            >
              {body}
            </Link>
          ) : (
            <div
              key={tool.slug}
              className="block border-b border-line py-5 opacity-60"
            >
              {body}
            </div>
          )
        })}
      </div>
    </div>
  )
}
