import Image from 'next/image'

/**
 * 文章封面。没有配图时退回到占位块，保证列表排版不塌，
 * 也提醒自己这篇还缺一张用于社交平台分发的封面图。
 */
export function Cover({
  src,
  alt,
  ratio = 'aspect-[16/9]',
  sizes = '(max-width: 768px) 100vw, 380px',
  priority = false,
}: {
  src?: string
  alt: string
  ratio?: string
  sizes?: string
  priority?: boolean
}) {
  if (!src) {
    return (
      <div
        className={`${ratio} grid place-items-center border-b border-line bg-raised text-center font-mono text-[10px] leading-relaxed text-faint`}
      >
        封面待补
      </div>
    )
  }
  return (
    <div className={`${ratio} relative overflow-hidden border-b border-line`}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        className="object-cover"
      />
    </div>
  )
}
