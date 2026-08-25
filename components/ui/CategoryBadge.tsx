import { categoryMap, type CategorySlug } from '@/lib/site'

/*
 * 赭石是全站的信号色，只给主线用。
 * 副线走中性，时事走冷色——三档一眼分得开，又不会让整页都在喊。
 */
const style: Record<CategorySlug, string> = {
  reverse: 'border-brand-edge text-brand',
  engineering: 'border-line text-muted',
  news: 'border-alt-edge text-alt',
}

export function CategoryBadge({ category }: { category: CategorySlug }) {
  return (
    <span
      className={`rounded border px-1.5 py-0.5 font-mono text-[10px] font-medium tracking-[0.06em] ${style[category]}`}
    >
      {categoryMap[category].label}
    </span>
  )
}
