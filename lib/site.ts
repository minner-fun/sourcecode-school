/**
 * 站点级配置。所有对外文案、联系方式、栏目划分都集中在这里，
 * 页面组件不硬编码这些内容，方便后面改定位而不用翻遍模板。
 */

/**
 * 站点主域名。国内节点与海外节点部署同一份代码时，
 * 用环境变量区分，保证 canonical / sitemap / RSS 里的绝对地址正确。
 */
export const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://sourcecode.school'
).replace(/\/$/, '')

export const site = {
  name: 'sourcecode.school',
  title: '逆向手记',
  /** 用在首页 hero 和 <title> 模板里 */
  tagline: '记录数据采集、逆向分析与数据工程的实际过程',
  description:
    '写自媒体与电商平台的数据采集、接口协议还原、参数加密分析，以及采集系统与数据管道在长期运行中遇到的实际问题。文章只写验证过的内容。同时承接相关的数据采集与分析需求。',
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
  /** 备案号，国内节点必填，留空则页脚不显示 */
  icp: '',
} as const

/**
 * 栏目划分。主线做采集/逆向（承接需求 + 吃搜索长尾），
 * 副线做数据工程与开发（能力举证），时事只作引流，不进站点主干。
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
  { href: '/cases', label: '案例' },
  { href: '/archive', label: '归档' },
  { href: '/search', label: '搜索' },
  { href: '/hire', label: '关于与接单' },
] as const
