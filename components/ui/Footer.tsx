import Link from 'next/link'
import { site } from '@/lib/site'

export function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-[1160px] flex-wrap items-center gap-x-5 gap-y-2.5 px-5 py-6 font-mono text-xs text-faint sm:px-8">
        <span>© {new Date().getFullYear()} {site.name}</span>
        <Link href="/feed.xml" className="transition-colors hover:text-brand">
          RSS
        </Link>
        <Link href="/archive" className="transition-colors hover:text-brand">
          归档
        </Link>
        {site.icp ? (
          <a
            href="https://beian.miit.gov.cn/"
            target="_blank"
            rel="noreferrer noopener"
            className="transition-colors hover:text-brand"
          >
            {site.icp}
          </a>
        ) : null}
        <span className="w-full sm:ml-auto sm:w-auto">
          技术内容仅供学习交流，请勿用于非法用途
        </span>
      </div>
    </footer>
  )
}
