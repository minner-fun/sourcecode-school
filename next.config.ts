import type { NextConfig } from 'next'

const config: NextConfig = {
  // 所有页面走 SSG，便于同时部署到 Vercel 和国内静态托管（OSS/COS + CDN）。
  // 需要纯静态产物时打开下面一行，产物在 out/：
  // output: 'export',
  outputFileTracingExcludes: { '*': ['./example/**'] },
}

export default config
