import { categoryMap, type CategorySlug } from '@/lib/site'

/** 时事用琥珀色区分，技术类统一走品牌蓝 */
export function CategoryBadge({ category }: { category: CategorySlug }) {
  const amber = category === 'news'
  return (
    <span
      className={
        amber
          ? 'rounded border border-amber-edge px-1.5 py-0.5 text-[10.5px] text-amber'
          : 'rounded border border-brand-edge px-1.5 py-0.5 text-[10.5px] text-brand'
      }
    >
      {categoryMap[category].label}
    </span>
  )
}
