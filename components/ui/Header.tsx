'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { nav, site } from '@/lib/site'
import { ThemeToggle } from './ThemeToggle'

export function Header() {
  const pathname = usePathname()

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-bg/88 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1080px] items-center gap-7 px-5 py-3.5 sm:px-8">
        <Link href="/" className="mr-auto flex items-center gap-2.5">
          {/* 赭石方块是全站的标记语言：代码块标题、断点行、这里，同一个信号 */}
          <span className="size-2 flex-none bg-brand" />
          <span className="font-mono text-[14.5px] font-medium tracking-[-0.01em] text-ink">
            {site.name}
          </span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={
                isActive(item.href)
                  ? 'relative text-[13.5px] text-ink after:absolute after:-bottom-[15px] after:left-0 after:h-px after:w-full after:bg-brand'
                  : 'text-[13.5px] text-muted transition-colors hover:text-ink'
              }
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <ThemeToggle />

        <Link
          href="/subscribe"
          className="whitespace-nowrap border border-brand px-3.5 py-1.5 text-[12.5px] font-medium text-brand transition-colors hover:bg-brand hover:text-bg"
        >
          订阅
        </Link>
      </div>

      {/* 窄屏把栏目收到第二行，避免和 CTA 挤在一起 */}
      <nav className="flex items-center gap-5 overflow-x-auto border-t border-line-soft px-5 py-2 md:hidden">
        {nav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={
              isActive(item.href)
                ? 'whitespace-nowrap text-[13px] text-brand'
                : 'whitespace-nowrap text-[13px] text-muted'
            }
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  )
}
