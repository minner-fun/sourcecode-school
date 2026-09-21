import type { Metadata } from 'next'
import Link from 'next/link'
import { JsonTool } from '@/components/ui/JsonTool'

export const metadata: Metadata = {
  title: 'JSON 格式化与校验',
  description:
    'JSON 在线格式化、校验、压缩、转义，可折叠树形查看，点节点取 JS / Python 访问路径。19 位大数不丢精度，自动剥 JSONP、还原转义过的 JSON 字符串，报错精确到行列。纯浏览器本地运行，不上传数据。',
  alternates: { canonical: '/tools/json' },
}

export default function JsonPage() {
  return (
    <div className="mx-auto max-w-[1080px] px-5 py-11 sm:px-8">
      <Link href="/tools" className="font-mono text-xs text-faint hover:text-brand">
        ← 全部工具
      </Link>
      <h1 className="display m-0 mb-3 mt-5 text-[28px] sm:text-[32px]">JSON 格式化与校验</h1>
      <p className="m-0 mb-8 max-w-[46em] text-[15px] leading-relaxed text-muted">
        粘贴接口响应即可：树形查看、格式化、压缩、转义，点任意节点拿到它的访问路径。
        JSONP 回调和转义过的 JSON 字符串会自动还原，不合法时指出第几行第几列、错在哪里。
        解析全部在你的浏览器里完成，内容不会发送到服务器。
      </p>

      <JsonTool />

      <section className="mt-16 max-w-[46em] border-t border-line pt-10">
        <h2 className="m-0 mb-4 text-[18px] font-semibold text-ink">和一般 JSON 格式化工具的区别</h2>
        <ul className="m-0 space-y-3 pl-5 text-[14.5px] leading-[1.85] text-ink-soft">
          <li>
            <b className="text-ink">大数不丢精度。</b>接口里 19 位的 ID 如果写成数字，
            浏览器自带的 <code className="font-mono text-[13px]">JSON.parse</code>{' '}
            会把它变成最接近的双精度浮点数，末几位悄悄改掉：
            <code className="font-mono text-[13px]">1789982744123456789</code> 读进来是{' '}
            <code className="font-mono text-[13px]">1789982744123456800</code>。
            这里用自己写的解析器，数字按原文保留，超出安全范围的会标上「大数」。
          </li>
          <li>
            <b className="text-ink">数字原样输出。</b>
            <code className="font-mono text-[13px]">1.10</code>、
            <code className="font-mono text-[13px]">1E5</code> 格式化之后还是原来的写法，
            不会被改成 <code className="font-mono text-[13px]">1.1</code>、
            <code className="font-mono text-[13px]">100000</code>。对照签名原文时这一点很要紧。
          </li>
          <li>
            <b className="text-ink">常见外壳自动剥掉。</b>
            <code className="font-mono text-[13px]">callback({'{…}'})</code> 形式的 JSONP、
            被 <code className="font-mono text-[13px]">JSON.stringify</code> 多包了一两层的字符串、
            日志里去掉外层引号的 <code className="font-mono text-[13px]">{'{\\"a\\":1}'}</code>，
            都会先还原再解析，并在输入框下方注明做过什么处理。
          </li>
          <li>
            <b className="text-ink">中文转 \u。</b>勾选后输出与 Python{' '}
            <code className="font-mono text-[13px]">json.dumps</code> 默认的{' '}
            <code className="font-mono text-[13px]">ensure_ascii=True</code> 一致。
            签名算法对请求体做摘要时，差一个转义结果就全不一样。
          </li>
        </ul>

        <h2 className="m-0 mb-4 mt-10 text-[18px] font-semibold text-ink">常见的不合法写法</h2>
        <ul className="m-0 space-y-3 pl-5 text-[14.5px] leading-[1.85] text-ink-soft">
          <li>最后一项后面多一个逗号：JavaScript 对象字面量允许，JSON 不允许。</li>
          <li>用单引号，或者键不加引号：那是 JS 对象，不是 JSON。</li>
          <li>
            出现 <code className="font-mono text-[13px]">undefined</code>、
            <code className="font-mono text-[13px]">NaN</code>、注释：JSON 里都没有这些。
          </li>
          <li>字符串里直接换行：要写成 \n。</li>
        </ul>
      </section>
    </div>
  )
}
