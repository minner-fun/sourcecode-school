import type { Metadata } from 'next'
import { IBM_Plex_Mono, IBM_Plex_Sans } from 'next/font/google'
import { site, siteUrl } from '@/lib/site'
import { Header } from '@/components/ui/Header'
import { Footer } from '@/components/ui/Footer'
import { SCHEME_STORAGE_KEY } from '@/lib/theme'
import './globals.css'

/*
 * 等宽是这个站的主声部：标题里的拉丁部分、元信息、状态标记、编号全走它。
 * 这个站的拉丁字符几乎都是代码、接口和哈希，本来就该是等宽的。
 *
 * next/font 在构建时把字体下载并同域托管，运行时不请求 fonts.googleapis.com，
 * 国内访问不受影响。中文字重走系统栈，见 globals.css。
 */
const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-plex-mono',
  display: 'swap',
})

const plexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-plex-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${site.title} · ${site.tagline}`,
    template: `%s · ${site.title}`,
  },
  description: site.description,
  authors: [{ name: site.author.name }],
  alternates: {
    canonical: '/',
    types: { 'application/rss+xml': `${siteUrl}/feed.xml` },
  },
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    siteName: site.title,
    url: siteUrl,
    title: `${site.title} · ${site.tagline}`,
    description: site.description,
  },
  twitter: { card: 'summary_large_image' },
  robots: { index: true, follow: true },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: site.title,
    alternateName: site.name,
    url: siteUrl,
    description: site.description,
    inLanguage: 'zh-CN',
    author: {
      '@type': 'Person',
      name: site.author.name,
      url: siteUrl,
      image: `${siteUrl}${site.author.avatar}`,
      sameAs: [site.contacts.github],
    },
  }

  return (
    /*
     * suppressHydrationWarning：下面那段脚本会在 React 接管前改写
     * <html> 上的 data-scheme，不加这个 React 会报属性不一致。
     */
    <html
      lang="zh-CN"
      className={`${plexMono.variable} ${plexSans.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen flex flex-col">
        {/*
          必须同步执行且排在所有内容之前：晚一步就会先按系统配色画一帧，
          手动选了深色的读者每次刷新都会被闪一下白。
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var s=localStorage.getItem(${JSON.stringify(SCHEME_STORAGE_KEY)});if(s==='dark'||s==='light')document.documentElement.dataset.scheme=s}catch(e){}`,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
