import type { Metadata } from 'next'
import Link from 'next/link'
import { CurlConverter } from '@/components/ui/CurlConverter'

export const metadata: Metadata = {
  title: 'curl 转 Python requests',
  description:
    '把浏览器 Network 面板复制出来的 curl 命令转成可直接运行的 Python requests 代码，自动拆出 headers、cookies 与请求体。纯浏览器本地运行，不上传数据。',
  alternates: { canonical: '/tools/curl-to-python' },
}

export default function CurlToPythonPage() {
  return (
    <div className="mx-auto max-w-[1080px] px-5 py-11 sm:px-8">
      <Link href="/tools" className="font-mono text-xs text-faint hover:text-brand">
        ← 全部工具
      </Link>
      <h1 className="display m-0 mb-3 mt-5 text-[28px] sm:text-[32px]">
        curl 转 Python requests
      </h1>
      <p className="m-0 mb-8 max-w-[46em] text-[15px] leading-relaxed text-muted">
        在浏览器 Network 面板右键请求 → Copy → Copy as cURL，粘到左侧即可。
        Cookie 会从请求头里单独拆成 cookies 字典，Content-Type 是 JSON 且请求体合法时用 json= 传参。
        转换全部在你的浏览器里完成，内容不会发送到服务器。
      </p>
      <CurlConverter />
    </div>
  )
}
