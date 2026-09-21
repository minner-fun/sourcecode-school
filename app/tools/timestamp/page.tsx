import type { Metadata } from 'next'
import Link from 'next/link'
import { TimestampTool } from '@/components/ui/TimestampTool'

export const metadata: Metadata = {
  title: '时间戳转换',
  description:
    'Unix 时间戳与日期时间互转，自动识别秒、毫秒、微秒、纳秒，支持时区切换与批量转换，能直接粘贴 HTTP Date 头。纯浏览器本地运行，不上传数据。',
  alternates: { canonical: '/tools/timestamp' },
}

const SNIPPETS: [string, string, string][] = [
  ['JavaScript', 'Date.now()', '毫秒'],
  ['Python', 'int(time.time())', '秒（time.time() 本身是浮点秒）'],
  ['Python', 'time.time_ns()', '纳秒'],
  ['Java', 'System.currentTimeMillis()', '毫秒'],
  ['Go', 'time.Now().Unix() / UnixMilli() / UnixNano()', '秒 / 毫秒 / 纳秒'],
  ['PHP', 'time()', '秒'],
  ['MySQL', 'UNIX_TIMESTAMP()', '秒'],
  ['Shell', 'date +%s', '秒'],
]

export default function TimestampPage() {
  return (
    <div className="mx-auto max-w-[1080px] px-5 py-11 sm:px-8">
      <Link href="/tools" className="font-mono text-xs text-faint hover:text-brand">
        ← 全部工具
      </Link>
      <h1 className="display m-0 mb-3 mt-5 text-[28px] sm:text-[32px]">时间戳转换</h1>
      <p className="m-0 mb-8 max-w-[46em] text-[15px] leading-relaxed text-muted">
        Unix 时间戳与日期时间互转。输入时间戳会按位数自动识别单位：10 位秒、13 位毫秒、16 位微秒、19 位纳秒；
        日期可以写成 2026-09-21 17:25:28、2026/9/21、带时区的 ISO 8601，也能直接粘贴响应头里的 Date。
        转换全部在你的浏览器里完成，内容不会发送到服务器。
      </p>

      <TimestampTool />

      <section className="mt-16 max-w-[46em] border-t border-line pt-10">
        <h2 className="m-0 mb-4 text-[18px] font-semibold text-ink">各语言怎么取当前时间戳</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[13.5px]">
            <thead>
              <tr className="border-b border-ink text-left">
                <th className="py-2 pr-4 font-semibold">语言</th>
                <th className="py-2 pr-4 font-semibold">写法</th>
                <th className="py-2 font-semibold">单位</th>
              </tr>
            </thead>
            <tbody>
              {SNIPPETS.map(([lang, code, unit]) => (
                <tr key={code} className="border-b border-line-soft">
                  <td className="py-2 pr-4 text-muted">{lang}</td>
                  <td className="py-2 pr-4 font-mono text-[12.5px] text-ink">{code}</td>
                  <td className="py-2 text-muted">{unit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2 className="m-0 mb-4 mt-10 text-[18px] font-semibold text-ink">抓包时常踩的几个坑</h2>
        <ul className="m-0 space-y-3 pl-5 text-[14.5px] leading-[1.85] text-ink-soft">
          <li>
            <b className="text-ink">秒和毫秒混用。</b>前端 JS 默认给毫秒，Python、PHP 后端常用秒。
            签名参数里的 <code className="font-mono text-[13px]">t</code> 或{' '}
            <code className="font-mono text-[13px]">ts</code> 用错一档，服务端校验时间窗就会直接拒绝。
          </li>
          <li>
            <b className="text-ink">时间戳本身没有时区。</b>它表示的是距 1970-01-01 00:00:00 UTC
            的时长，同一个时间戳在北京和纽约显示成不同的日期时间，但指的是同一个时刻。时区只影响“显示成什么”。
          </li>
          <li>
            <b className="text-ink">大数精度。</b>19 位纳秒时间戳超过了 JavaScript
            Number 能精确表示的范围（2⁵³，约 9×10¹⁵），用 JSON.parse 读进来末几位会被悄悄改掉。这个工具内部用 BigInt 计算，不会丢位。
          </li>
          <li>
            <b className="text-ink">不带时区的日期字符串。</b>
            <code className="font-mono text-[13px]">2026-09-21 17:25:28</code>{' '}
            这样的写法在不同语言、不同服务器上会按不同的本地时区理解，跨时区对接时最好统一用带偏移的 ISO 8601。
          </li>
        </ul>
      </section>
    </div>
  )
}
