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
  name: 'sourcecode.school',
  title: '逆向手记',
  /** 用在首页 hero 和 <title> 模板里 */
  tagline: '记录数据采集、逆向分析与数据工程的实际过程',
  description:
    '写自媒体与电商平台的数据采集、接口协议还原、参数加密分析，以及采集系统与数据管道在长期运行中遇到的实际问题。只写验证过的内容。',
  author: {
    name: 'Minner',
    /** 关于页与文章末尾作者卡使用 */
    bio: '长期做数据采集与逆向分析，同时负责采集系统后端与数据管道。方向集中在自媒体与电商平台的数据获取、接口协议还原，以及在此之上的数据工程与分析。',
    avatar: '/avatar.png',
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
 * 栏目划分。主线做采集/逆向（搜索长尾最肥的方向），
 * 副线做数据工程与开发，时事只作补充，不进站点主干。
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
    slug: 'engineering',
    label: '数据工程与开发',
    en: 'ENGINEERING',
    role: 'secondary',
    description:
      '采集系统的调度与去重、数据管道与存储选型、后端接口与前端界面。偏工程实现与长期维护经验。',
  },
  {
    slug: 'news',
    label: '科技时事',
    en: 'NEWS',
    role: 'tertiary',
    description:
      '平台政策、合规变化与行业动向。只记与实际取数工作相关的部分，不做泛资讯搬运。',
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
