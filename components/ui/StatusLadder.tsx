/**
 * 首页的签名元素：一次请求从被拦到通过的完整过程。
 *
 * 这是这个站全部内容的母题，也正好是接单卖的东西——
 * 与其用一句形容词说「专业」，不如把这行当的核心动作原样摆出来。
 * 纯 CSS 逐行显现，无客户端 JS，动效在 prefers-reduced-motion 下自动关闭。
 */
export function StatusLadder() {
  const steps = ['定位生成位置', '剥离混淆', '脱环境复现']

  return (
    <figure
      aria-label="一次被签名校验拦下的请求，经过分析后通过"
      className="m-0 overflow-hidden rounded-lg border border-line bg-surface font-mono text-[12.5px]"
    >
      <figcaption className="flex items-center gap-2 border-b border-line bg-raised px-4 py-2.5 text-[10.5px] font-medium tracking-[0.12em] text-faint">
        <span className="size-[5px] flex-none rounded-full bg-brand" />
        REQUEST
      </figcaption>

      <div className="px-4 py-3 text-muted [animation:ladder_.35s_ease-out_both]">
        <span className="text-ink">GET</span> /api/v2/item?id=1024
        <span className="text-faint">&amp;sign=</span>c41d8f…9e2b
      </div>

      {/* 被拦下的那一行，用断点命中的高亮底色 */}
      <div className="flex items-baseline gap-3 border-l-2 border-brand bg-brand-tint px-4 py-3 [animation:ladder_.35s_ease-out_.12s_both]">
        <span className="text-[15px] font-semibold tabular-nums text-brand">403</span>
        <span className="text-brand-deep">invalid signature</span>
      </div>

      {/* 中间这段是方法，也是文章按什么顺序写的 */}
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 border-y border-dashed border-line px-4 py-3 text-[11.5px] text-muted [animation:ladder_.35s_ease-out_.24s_both]">
        {steps.map((step, i) => (
          <li key={step} className="flex items-center gap-2">
            {i > 0 ? <span className="text-faint">→</span> : null}
            {step}
          </li>
        ))}
      </ol>

      <div className="flex items-baseline gap-3 border-l-2 border-pass px-4 py-3 [animation:ladder_.35s_ease-out_.36s_both]">
        <span className="text-[15px] font-semibold tabular-nums text-pass">200</span>
        <span className="text-muted">OK</span>
      </div>
    </figure>
  )
}
