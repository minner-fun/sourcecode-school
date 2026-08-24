import Link from 'next/link'
import { Pre } from './Pre'

/**
 * 逆向类文章的固定叙事骨架：请求长什么样 → 调用链 → 脱环境复现。
 * 做成组件而不是每篇重排一遍，文章之间视觉一致，写的时候也少一层负担。
 */

/** 调用链。最后一项传 done 会渲染成收尾节点。 */
export function CallChain({
  steps,
}: {
  steps: { fn: string; note: string; done?: boolean }[]
}) {
  return (
    <div className="my-6 rounded-xl border border-line bg-raised p-5">
      <ol className="flex flex-col">
        {steps.map((step, i) => (
          <li key={step.fn + i} className="flex flex-col">
            <div className="flex items-center gap-3.5">
              <span
                className={
                  step.done
                    ? 'grid size-[26px] shrink-0 place-items-center rounded-md border border-brand font-mono text-[11px] font-medium text-brand'
                    : 'grid size-[26px] shrink-0 place-items-center rounded-md border border-line font-mono text-[11px] font-medium text-muted'
                }
              >
                {step.done ? '✓' : i + 1}
              </span>
              <code
                className={
                  step.done
                    ? 'font-mono text-[13.5px] font-medium text-brand'
                    : 'font-mono text-[13.5px] font-medium text-ink'
                }
              >
                {step.fn}
              </code>
              <span className="text-[13px] text-muted">{step.note}</span>
            </div>
            {i < steps.length - 1 ? (
              <span className="ml-[13px] h-4 w-px bg-line" aria-hidden />
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
    <div className="my-6 grid gap-3.5 md:grid-cols-2 [&>figure]:my-0">
      {children}
    </div>
  )
}

/** 结论、坑、提醒。默认是结论样式，type="warn" 用琥珀色。 */
export function Note({
  type = 'note',
  children,
}: {
  type?: 'note' | 'warn'
  children: React.ReactNode
}) {
  return (
    <div
      className={
        type === 'warn'
          ? 'my-6 border-l-2 border-amber py-0.5 pl-4.5 text-[15px] leading-relaxed text-ink [&>p]:m-0'
          : 'my-6 border-l-2 border-brand py-0.5 pl-4.5 text-[15px] leading-relaxed text-ink [&>p]:m-0'
      }
    >
      {children}
    </div>
  )
}

/** 一组关键数字，用在案例复盘类文章里 */
export function Stats({
  items,
}: {
  items: { label: string; value: string }[]
}) {
  return (
    <dl className="my-6 grid gap-3.5 sm:grid-cols-3">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-xl border border-line bg-raised p-4"
        >
          <dt className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-faint">
            {item.label}
          </dt>
          <dd className="text-[17px] font-medium text-ink">{item.value}</dd>
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
