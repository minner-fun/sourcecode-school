import Link from 'next/link'
import { site } from '@/lib/site'

export function Footer() {
  return (
    <footer className="mt-20 border-t border-line">
      <div className="mx-auto flex max-w-[1080px] flex-wrap items-center gap-x-6 gap-y-2.5 px-5 py-7 font-mono text-[11.5px] text-faint sm:px-8">
        <span>© {new Date().getFullYear()} {site.name}</span>
        <Link href="/feed.xml" className="transition-colors hover:text-brand">
          RSS
        </Link>
        <Link href="/archive" className="transition-colors hover:text-brand">
          归档
        </Link>
        <a
          href={site.contacts.github}
          target="_blank"
          rel="noreferrer noopener"
          className="transition-colors hover:text-brand"
        >
          GitHub
        </a>
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
