# sourcecode.school

技术内容站。主线是数据采集与逆向分析，副线是数据工程与前后端开发，另有科技时事。
站点同时承担三件事：吃搜索长尾、承接接单线索、作为找工作时的作品集。

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
  business.ts       服务项、合作流程、案例、不接的需求
  posts.ts          内容读取、系列、标签、归档
  mdx.ts            remark / rehype 配置
  tools.ts          工具页清单
  curl.ts           curl → Python 转换逻辑
scripts/            新建文章、一稿多发导出
example/            最初的设计稿（Claude Design canvas，不参与构建）
```

改站点定位、栏目、联系方式只需要动 `lib/site.ts`；改报价口径和案例只需要动 `lib/business.ts`。

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

国内为主、兼顾海外，建议双域名双节点，同一份代码：

| | 国内节点 | 海外节点 |
| --- | --- | --- |
| 域名 | 已备案的 `.com` / `.cn` | `sourcecode.school` |
| 托管 | 静态托管 + CDN（OSS / COS）或轻量服务器 | Vercel / Cloudflare |
| SEO | 百度、微信搜一搜 | Google |
| 用途 | 接单转化，访问速度是硬指标 | 作品集、远程岗位、海外客户 |

两边分别设置 `NEXT_PUBLIC_SITE_URL`，保证各自的 canonical、sitemap、RSS 地址正确。

> `.school` 这类后缀大概率不在工信部允许备案的白名单里，需要自己核实。
> 备不了案就用不了国内主机和国内 CDN，这是选国内域名时要先确认的事。

需要纯静态产物（OSS / COS 这类只托管静态文件的服务）时，打开 `next.config.ts` 里的
`output: 'export'`，产物在 `out/`。**注意这种模式下 Server Action 不可用**，
`/hire` 的表单要改成纯联系方式展示。

环境变量见 `.env.example`。

## 几个已经踩过的坑

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
- **工具页**：`lib/tools.ts` 里标了 `planned` 的三个还没实现。
