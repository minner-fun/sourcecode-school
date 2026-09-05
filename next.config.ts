import type { NextConfig } from 'next'

const config: NextConfig = {
  // 所有页面走 SSG，便于同时部署到 Vercel 和国内静态托管（OSS/COS + CDN）。
  // 需要纯静态产物时打开下面一行，产物在 out/：
  // output: 'export',
  outputFileTracingExcludes: { '*': ['./example/**'] },

  // 站点从「内容 + 接单」收敛为纯内容站，已删页面做永久跳转，
  // 避免外部链接和已被收录的 URL 变成 404。
  // 注意：打开 output: 'export' 后 redirects 不生效，那种部署方式要在托管层配。
  async redirects() {
    return [
      { source: '/hire', destination: '/about', permanent: true },
      { source: '/contact', destination: '/about', permanent: true },
      { source: '/cases', destination: '/', permanent: true },
      // 资讯栏目取消，原有链接落到主线
      { source: '/category/news', destination: '/category/reverse', permanent: true },
    ]
  },
}

export default config
