/**
 * 站点级配置。所有对外文案、联系方式、栏目划分都集中在这里，
 * 页面组件不硬编码这些内容，方便后面改定位而不用翻遍模板。
 */

/**
 * 站点主域名，决定 canonical / sitemap / RSS 里的绝对地址。
 *
 * 优先级：显式配置 > Vercel 注入的生产域名 > 本地 > 兜底。
 *
 * 中间那一档很关键：正式域名还没接上时，如果直接兜底到 sourcecode.school，
 * canonical 会全部指向一个不存在的域名——等于告诉搜索引擎别收录当前这个站。
 * Vercel 会注入 VERCEL_PROJECT_PRODUCTION_URL（稳定的生产域名，不随部署变），
 * 用它就能让 *.vercel.app 阶段的站正常被收录。
 */
function resolveSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL
  if (explicit) return explicit.replace(/\/$/, '')

  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL
  if (vercel) return `https://${vercel}`

  if (process.env.NODE_ENV === 'development') return 'http://localhost:3000'

  // 自建节点上两个变量都没配就会走到这里，多半是漏配了，构建时提醒一次
  console.warn(
    '[site] 未设置 NEXT_PUBLIC_SITE_URL，canonical / sitemap / RSS 将使用默认域名。' +
      '自建部署请在环境变量里配置实际域名。',
  )
  return 'https://sourcecode.school'
}

export const siteUrl = resolveSiteUrl()

export const site = {
  /** 品牌名，与微信公众号保持一致——一个身份贯穿站点和公众号 */
  name: '网虫Spider',
  /** 域名，用于页脚和结构化数据的 alternateName */
  domain: 'sourcecode.school',
  /** 用在首页 hero 和 <title> 模板里 */
  tagline: '采集逆向、源码剖析与工程实践，只写跑通过的过程',
  description:
    '接口协议还原、加密参数分析、开源项目源码拆解，以及后端、数据管道与运维在长期运行中的实际问题。每篇都给到能复现的最小代码；没验证过的部分会写明是思路，不当成结论。',
  author: {
    name: 'Minner',
    /** 关于页与文章末尾作者卡使用 */
    bio: '长期做数据采集与逆向分析，同时负责采集系统后端与数据管道。方向集中在自媒体与电商平台的数据获取、接口协议还原，以及在此之上的数据工程与分析。',
    avatar: '/avatar.png',
  },
  /**
   * 微信公众号。国内读者的订阅行为几乎都在这里，优先级高于 RSS。
   * qr 留空时订阅页显示「微信里搜名字」的引导，填了则渲染二维码。
   */
  wechatMp: {
    name: '网虫Spider',
    qr: '',
  },
  contacts: {
    wechat: 'NarraData',
    email: 'minner.fun@gmail.com',
    qq: '',
    telegram: '',
    github: 'https://github.com/minner-fun',
  },
  /**
   * 备案信息，国内节点必填，留空则页脚不显示。
   * icp   工信部 ICP 备案号，形如 沪ICP备xxxxxxxx号
   * police 公安备案号（纯数字），页脚需链接到 beian.mps.gov.cn 对应查询页
   */
  icp: '',
  police: '',
} as const

/**
 * 栏目划分。两条主线：采集/逆向是差异化所在，源码剖析产出稳定且长尾好；
 * 工程实践收口前后端、运维、大数据，只收真实经验。
 *
 * 刻意不设「资讯」栏目：半衰期以天计、没有搜索长尾、也不证明能力。
 * 行业动向作为分析文章的引子出现即可，不单独成栏。
 */
export const categories = [
  {
    slug: 'reverse',
    label: '采集与逆向',
    en: 'REVERSE',
    role: 'primary',
    description:
      '接口协议还原、加密参数分析、风控对抗与抓包实录。这条线的文章会尽量给到可复现的最小代码。',
  },
  {
    slug: 'teardown',
    label: '源码剖析',
    en: 'TEARDOWN',
    role: 'primary',
    description:
      '把值得读的开源项目拆开：它解决什么问题、核心抽象是什么、关键路径怎么走、哪些设计值得抄。',
  },
  {
    slug: 'engineering',
    label: '工程实践',
    en: 'ENGINEERING',
    role: 'secondary',
    description:
      '前后端、运维、数据管道与大数据。只写从真实项目里长出来的经验，查文档就能写出来的教程不写。',
  },
] as const

export type CategorySlug = (typeof categories)[number]['slug']

export const categoryMap = Object.fromEntries(
  categories.map((c) => [c.slug, c]),
) as Record<CategorySlug, (typeof categories)[number]>

export const nav = [
  { href: '/', label: '文章' },
  { href: '/series', label: '系列' },
  { href: '/tools', label: '工具' },
  { href: '/archive', label: '归档' },
  { href: '/search', label: '搜索' },
  { href: '/about', label: '关于' },
] as const
