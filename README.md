# sourcecode.school

技术内容站。主线是数据采集与逆向分析，副线是数据工程与前后端开发，另有科技时事。
纯内容站：吃搜索长尾，沉淀可检索的工作记录，同时作为技术能力的公开举证。
站内不放服务报价、接单入口一类的经营性内容——目标是走个人 ICP 备案、部署到国内节点。

技术栈：Next.js 16（App Router）+ MDX + Tailwind v4，全站 SSG。

## 快速开始

```bash
pnpm install
pnpm dev            # http://localhost:3000
pnpm build          # 生产构建
pnpm typecheck      # 只跑类型检查
```

## 目录结构

```
app/                路由与页面
  posts/[slug]/     文章详情
  category/[slug]/  栏目页（采集与逆向 / 数据工程与开发 / 科技时事）
  series/           系列列表与详情
  tags/[tag]/       标签页
  tools/            在线小工具
  feed.xml/         RSS
  sitemap.ts        站点地图
  robots.ts         robots.txt
components/
  mdx/              文章里可用的自定义组件
  ui/               页面组件
content/posts/      文章正文，一篇一个 .mdx
lib/
  site.ts           站点信息、栏目划分、导航、联系方式
  posts.ts          内容读取、系列、标签、归档
  mdx.ts            remark / rehype 配置
  tools.ts          工具页清单
  curl.ts           curl → Python 转换逻辑
scripts/            新建文章、一稿多发导出
example/            最初的设计稿（Claude Design canvas，不参与构建）
```

改站点定位、栏目、联系方式、备案号只需要动 `lib/site.ts`。

## 写文章

```bash
pnpm new "文章标题" reverse      # 栏目：reverse | engineering | news
```

生成的文件在 `content/posts/<slug>.mdx`。**slug 是 URL 的一部分，发布后不要再改**，
中文标题生成的 slug 是占位值，请手工改成有意义的英文。

### frontmatter

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `title` | 是 | 文章标题 |
| `date` | 是 | `YYYY-MM-DD` |
| `category` | 是 | `reverse` / `engineering` / `news` |
| `excerpt` | 是 | 一句话摘要，出现在列表页、RSS、搜索结果和社交卡片里 |
| `tags` | 否 | 数组，标签页按此聚合 |
| `cover` | 否 | 封面图路径，如 `/covers/xxx.png` |
| `series` | 否 | 系列 slug，相同值的文章自动成组 |
| `seriesTitle` | 否 | 系列显示名，同系列写一次即可 |
| `seriesOrder` | 否 | 系列内顺序，数字小的在前 |
| `draft` | 否 | `true` 时只在 `pnpm dev` 下可见 |

缺必填字段或 `category` 写错，构建会直接报错并指出是哪个文件——不会静默出一个坏页面。

### 正文可用组件

````mdx
<CallChain steps={[
  { fn: 'r.request()', note: '业务层发起请求' },
  { fn: 'CryptoJS.MD5', note: '取 32 位摘要', done: true },
]} />

<Compare>

```http title="请求"
GET /api/item?id=1
```

```json title="响应"
{ "code": 40301 }
```

</Compare>

<Note>需要强调的结论。</Note>
<Note type="warn">风险提示，用琥珀色。</Note>

<Stats items={[{ label: '日均采集', value: '40 万条' }]} />
````

代码块支持 `title="文件名"`、`showLineNumbers`、`{3-5}` 高亮指定行、`/token/` 高亮指定词。
高亮在构建时由 shiki 完成，页面上没有对应的客户端 JS。

## 发一篇文章

```bash
pnpm new "文章标题" reverse   # 栏目：reverse | engineering | news
# 改 slug、写正文
pnpm dev                     # localhost:3000 预览，改完刷新浏览器即可
# frontmatter 里 draft 改成 false
git add . && git commit && git push   # Vercel 自动部署
pnpm export:post <slug>      # 导出公众号 / 知乎版本
```

草稿（`draft: true`）只在本地 `pnpm dev` 可见，不会进生产构建。

> 文章内容是用 `fs` 读的，不在模块依赖图里，所以浏览器不会自动刷新——
> 改完手动按一下刷新。开发环境不走缓存，刷新即是最新。

### 分发顺序别搞反

**先发自己的站，收录之后再发知乎和公众号。**

反过来做，知乎的域名权重远高于新站，搜索引擎会把知乎那份判成原创、
把你自己的站判成转载——你自己的文章，你的站排在别人后面，事后很难纠正。

稳妥节奏：站上先发 → 提交百度和 Google 收录 → 隔一两天再外发，
且外发版本文末带原文链接。

## 一稿多发

站点是沉淀，流量主要来自公众号、知乎、掘金。一份 MDX 导出成各平台能直接用的形态：

```bash
pnpm export:post <slug>     # 单篇
pnpm export:post --all      # 全部
```

产物在 `export-out/`：

- `<slug>.wechat.html` —— 全内联样式。浏览器打开，全选复制，粘进公众号编辑器，样式不会掉。
  公众号正文不允许外链，脚本会把链接降级成「文字（地址）」。
- `<slug>.zhihu.md` —— 纯 markdown，知乎 / 掘金 / CSDN 通用。

`CallChain`、`Compare`、`Note`、`Stats` 会降级成有序列表和引用块这些各平台都认的原生结构。
如果新增了自定义组件而没在 `scripts/export-post.mjs` 里加转换规则，导出时会打印告警。

## 部署

当前走 Vercel：连上 GitHub 仓库后，push 到主分支即自动构建部署，不需要额外 CI。

### 站点地址是怎么确定的

`lib/site.ts` 里的 `siteUrl` 决定 canonical、sitemap、RSS 里的绝对地址，按这个优先级取：

1. `NEXT_PUBLIC_SITE_URL` —— 显式配置，接上正式域名后在 Vercel 环境变量里设它
2. `VERCEL_PROJECT_PRODUCTION_URL` —— Vercel 自动注入的稳定生产域名
3. 本地开发 → `http://localhost:3000`
4. 都没有 → 打印警告并兜底

第 2 档是刻意留的：正式域名还没接上时，如果直接兜底到 `sourcecode.school`，
canonical 会全部指向一个不存在的域名，等于告诉搜索引擎别收录当前这个站。

自建节点（香港 / 国内）部署时**必须**显式设置 `NEXT_PUBLIC_SITE_URL`，
漏配会在构建日志里看到警告。

### 迁到国内节点

目标是备案后搬到上海的阿里云节点（大陆同城延迟个位数毫秒，比现在 Vercel 的 ~300ms 快一个量级）。
已实测该机 80/443 在安全组层面是放行的，从境外访问 TCP 握手 ~55ms，技术路径没有障碍。

**但域名必须先备案。** 用大陆节点对外提供 web 服务而域名未备案，
阿里云会扫描到并发整改通知，逾期封禁 80/443 或停实例。

备案要同时满足两个条件：

1. **顶级域在工信部批复清单里** —— `.school` 在清单内，可以备案
   （`.shop` `.site` `.art` `.fun` `.com` 同样在内）
2. **域名注册商是已获批复的机构** —— 若当前注册商无中国资质，需先转移到有资质的注册商

两项都可在工信部 <https://domain.miit.gov.cn/> 的「域名注册管理机构审批情况」查询。
不要依赖任何二手清单。

另外，**个人备案的网站不得含经营性内容**——服务报价、接单入口、付费下载都可能被判定为经营性，
导致驳回或事后注销。这是站点收敛为纯内容站的直接原因。
若将来要放商业内容，需改为企业主体备案。

备案号填进 `lib/site.ts` 的 `icp` 和 `police` 两个字段，页脚会自动渲染并链到官方查询页。

环境变量见 `.env.example`。

## 设计系统

主色是**赭石橙 `#b4530a`**——调试器命中断点那一行的高亮色，也是 403 的颜色。
刻意避开蓝：国内技术社区清一色蓝调，再用蓝等于隐形。赭石只给主线内容和真正的信号用
（断点行、代码块标记、当前项、CTA），数据工程走中性、时事走冷青 `#2c5f6b`，
三档分得开又不会整页在喊。

等宽字体是主声部：IBM Plex Mono 承担标题的拉丁部分、元信息、状态标记、编号；
IBM Plex Sans 管拉丁正文。这个站的拉丁字符几乎都是代码、接口和哈希，本来就该是等宽的。
中文走系统栈，不引 webfont。

列表用导轨式：日期挪进左侧一条等宽导轨，像十六进制编辑器的地址列。
首页 hero 的状态阶梯（`403` → 分析 → `200`）是全站的签名元素。

### 改颜色

全部颜色定义在 `app/globals.css` 顶部的 `:root` 里，组件只用语义 token
（`bg-bg` `text-ink` `border-line` `text-brand` 等），不写死色值。
深色一组值以 `--d-*` 前缀**只定义一次**，两条切换路径都引用它，改颜色只动一处。

### 深色模式

有两条进入路径，必须共存：

- `@media (prefers-color-scheme: dark)` 下的 `:root:not([data-scheme='light'])` —— 跟随系统
- `:root[data-scheme='dark']` —— 用户手动切换，无视系统偏好

`<html>` 上的属性用 `data-scheme` 而不是 `data-theme`：shiki 已经在 `<pre>` 上用了
`data-theme`，同名会让选择器很难读。

切换按钮是三态循环（AUTO / LIGHT / DARK），选择存在 `localStorage`。
`app/layout.tsx` 里有一段同步执行的内联脚本在首屏绘制前读取它——
晚一步就会先按系统配色画一帧，手动选了深色的读者每次刷新都会被闪一下白。

## 几个已经踩过的坑

**`.shiki` 这个 class 在双主题模式下不存在。** rehype-pretty-code 配双主题时，
配色写成每个 token span 上的 `--shiki-light` / `--shiki-dark` 两个自定义属性，
标记用的是 `data-theme` 属性而不是 `shiki` class。CSS 规则挂在 `.shiki` 上会一个元素都匹配不到，
**而且不报错**——代码块静默变成单色。选择器见 `app/globals.css` 末尾。

**服务端组件不能从 `'use client'` 模块 import 普通值。** 拿到的是客户端引用代理不是真实值，
拼进字符串会变成 `undefined` 且不报错。共享常量放普通模块，见 `lib/theme.ts`。

**`next-mdx-remote` v6 默认剥掉 JS 表达式。** `blockJS` 默认为 `true`，会把
`<CallChain steps={[...]} />` 这类属性表达式静默丢弃，组件拿到 `undefined`。
本站内容是第一方的，所以在 `lib/mdx.ts` 里关掉了它，`blockDangerousJS` 保持开启。

**不要引 Google Fonts CDN。** 国内访问 `fonts.googleapis.com` 会卡住首屏。
等宽字体走 `next/font/google`，它在构建时把字体下载并同域托管，运行时不请求 Google。
中文字重直接用系统字体栈，不引 webfont——一个完整的中文字体动辄几 MB。

**目录锚点用 `github-slugger` 生成。** 必须和 `rehype-slug` 用同一套算法，
否则中文标题的锚点对不上，目录点了不跳。

## 还没做的

- **评论**：需要先选服务。Giscus（GitHub Discussions，国内访问不稳）
  或 Waline（自建，国内可用）——取决于读者主要在哪边。
- **文章 OG 图自动生成**：`next/og` 默认字体不含中文，要自动生成得内嵌一个中文字体子集，
  目前先用 `cover` 字段手工指定。
- **访问统计**：国内可用 百度统计 / 51la，海外用 Plausible / Umami。
- **封面图**：`public/covers/` 还是空的，没有封面的文章分享出去是无图卡片。
- **工具页**：`lib/tools.ts` 里标了 `planned` 的三个还没实现。
