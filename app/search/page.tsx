import type { Metadata } from 'next'
import { getAllPosts } from '@/lib/posts'
import { Search, type SearchEntry } from '@/components/ui/Search'

export const metadata: Metadata = {
  title: '搜索',
  description: '按标题、摘要与标签搜索全站文章。',
  alternates: { canonical: '/search' },
  // 搜索页本身没有内容价值，交给归档和标签页去收录
  robots: { index: false, follow: true },
}

export default function SearchPage() {
  /*
   * 索引直接内联进页面，纯静态托管也能用，无需接口。
   * 单条约 200 字节，几百篇文章量级完全可以接受；
   * 上到一千篇以上再改成按需拉取一个 JSON 文件。
   */
  const entries: SearchEntry[] = getAllPosts().map((post) => ({
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    tags: post.tags,
    category: post.category,
    date: post.date,
  }))

  return (
    <div className="mx-auto max-w-[720px] px-5 py-12 sm:px-8">
      <div className="mb-4 font-mono text-[11px] tracking-[0.14em] text-brand">
        SEARCH
      </div>
      <h1 className="m-0 mb-7 text-[30px] font-medium leading-tight tracking-tight sm:text-[34px]">
        搜索
      </h1>
      <Search entries={entries} />
    </div>
  )
}
