import Link from 'next/link'
import { Pre } from './Pre'

/**
 * 逆向类文章的固定叙事骨架：请求长什么样 → 调用链 → 脱环境复现。
 * 做成组件而不是每篇重排一遍，文章之间视觉一致，写的时候也少一层负担。
 */

/** 调用链。步骤是真实执行顺序，编号带信息。最后一项传 done 渲染成收尾节点。 */
export function CallChain({
  steps,
}: {
  steps: { fn: string; note: string; done?: boolean }[]
}) {
  return (
    <div className="my-7 border border-line bg-raised">
      <div className="tag-line border-b border-line bg-surface px-4 py-2.5 text-faint">
        Call chain
      </div>
      <ol className="flex flex-col px-4 py-3.5">
        {steps.map((step, i) => (
          <li key={step.fn + i} className="flex flex-col">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span
                className={
                  step.done
                    ? 'w-5 shrink-0 font-mono text-[11px] font-semibold tabular-nums text-brand'
                    : 'w-5 shrink-0 font-mono text-[11px] tabular-nums text-faint'
                }
              >
                {step.done ? '→' : String(i + 1).padStart(2, '0')}
              </span>
              <code
                className={
                  step.done
                    ? 'font-mono text-[13px] font-semibold text-brand'
                    : 'font-mono text-[13px] font-medium text-ink'
                }
              >
                {step.fn}
              </code>
              <span className="text-[12.5px] text-muted">{step.note}</span>
            </div>
            {i < steps.length - 1 ? (
              <span className="ml-[9px] h-3 w-px bg-line" aria-hidden />
            ) : null}
          </li>
        ))}
      </ol>
    </div>
  )
}

/**
 * 两块代码并排对照，常用于「正常请求 / 改一个字符后的响应」。
 * children 直接放两个代码块，语法高亮走同一条 shiki 管线。
 */
export function Compare({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-7 grid gap-3.5 md:grid-cols-2 [&>figure]:my-0">
      {children}
    </div>
  )
}

/**
 * 结论与风险提示。带标签，避免和普通引用块混成一片。
 * warn 走红色而不是赭石——赭石在这个站是「被拦下」的信号，不是「危险」。
 */
export function Note({
  type = 'note',
  children,
}: {
  type?: 'note' | 'warn'
  children: React.ReactNode
}) {
  const warn = type === 'warn'
  return (
    <aside
      className={`my-7 border-l-2 pl-4 ${warn ? 'border-fail' : 'border-brand'}`}
    >
      <div
        className={`tag-line mb-1.5 ${warn ? 'text-fail' : 'text-brand'}`}
      >
        {warn ? '注意' : '结论'}
      </div>
      <div className="text-[14.5px] leading-relaxed text-ink [&>p]:m-0">
        {children}
      </div>
    </aside>
  )
}

/** 一组关键数字，用在案例复盘类文章里 */
export function Stats({
  items,
}: {
  items: { label: string; value: string }[]
}) {
  return (
    <dl className="my-7 grid divide-y divide-line border-y border-line sm:grid-cols-3 sm:divide-x sm:divide-y-0">
      {items.map((item) => (
        <div key={item.label} className="px-1 py-3.5 sm:px-4 sm:first:pl-1">
          <dt className="tag-line mb-1.5 text-faint">{item.label}</dt>
          <dd className="m-0 font-mono text-[19px] font-semibold tabular-nums text-ink">
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  )
}

/** 站内链接，MDX 里写普通 markdown 链接也会走这里 */
function Anchor({ href = '', ...rest }: React.ComponentProps<'a'>) {
  if (href.startsWith('/')) return <Link href={href} {...rest} />
  if (href.startsWith('#')) return <a href={href} {...rest} />
  return <a href={href} target="_blank" rel="noreferrer noopener" {...rest} />
}

export const mdxComponents = {
  a: Anchor,
  pre: Pre,
  CallChain,
  Compare,
  Note,
  Stats,
}
