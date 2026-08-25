import type { Metadata } from 'next'
import { JetBrains_Mono } from 'next/font/google'
import { site, siteUrl } from '@/lib/site'
import { Header } from '@/components/ui/Header'
import { Footer } from '@/components/ui/Footer'
import './globals.css'

/*
 * next/font 在构建时把字体下载并同域托管，运行时不会请求 fonts.googleapis.com，
 * 所以国内访问不受影响。中文字重走系统栈，见 globals.css。
 */
const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-jetbrains',
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
    <html lang="zh-CN" className={jetbrains.variable}>
      <body className="min-h-screen flex flex-col">
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
