'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { nav, site } from '@/lib/site'

export function Header() {
  const pathname = usePathname()

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-bg/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1160px] items-center gap-6 px-5 py-3.5 sm:px-8">
        <Link href="/" className="mr-auto flex items-center gap-2.5">
          <span className="grid size-[22px] place-items-center rounded-md border border-brand font-mono text-[11px] font-medium text-brand">
            S
          </span>
          <span className="font-mono text-[15px] font-medium tracking-tight">
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
                  ? 'text-sm text-brand'
                  : 'text-sm text-muted transition-colors hover:text-ink'
              }
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <Link
          href="/hire"
          className="rounded-lg border border-brand px-3.5 py-1.5 text-[13px] font-medium text-brand transition-colors hover:bg-brand-tint"
        >
          找我接单
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
