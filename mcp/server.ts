#!/usr/bin/env node
/**
 * 网虫Spider 站点的发布 MCP 服务器。
 *
 * 站点是静态站、内容在 git 里、push 触发 Vercel 部署，
 * 所以「发布」的真实含义是：写 MDX → 校验 → 提交 → 推送。
 * 这里把站点的写作契约和这套动作一起封装出去，
 * 写作侧的 agent 不必每次重新被交代一遍站点规矩。
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'
import fs from 'node:fs/promises'
import path from 'node:path'
import {
  REPO,
  POSTS_DIR,
  site,
  posts,
  checkSlug,
  scanCommercial,
  validateAll,
  buildFrontmatter,
  postPath,
  exists,
  today,
  git,
  stagedFiles,
  currentBranch,
} from './lib.ts'

const server = new McpServer({ name: 'sourcecode-school', version: '1.0.0' })

const text = (s: string) => ({ content: [{ type: 'text' as const, text: s }] })

/* ------------------------------------------------------------------ *
 * 让写作 agent 懂规矩
 * ------------------------------------------------------------------ */

server.registerTool(
  'get_writing_guide',
  {
    title: '站点写作规范',
    description:
      '返回本站的栏目划分、写作标准、frontmatter 契约、可用的 MDX 组件与合规约束。写文章前先调这个。',
    inputSchema: {},
  },
  async () => {
    const { categories, site: cfg } = await site()
    const lines = [
      `# ${cfg.name} 写作规范`,
      '',
      `站点：${cfg.domain}　　定位：${cfg.tagline}`,
      '',
      '## 栏目（category 字段只能取这三个 slug 之一）',
      ...categories.flatMap((c) => [
        `- **${c.slug}**（${c.label}）：${c.description}`,
      ]),
      '',
      '## 写作标准',
      '- 只写自己跑通过的内容。没验证过的部分要写明「这是思路」，不当成结论。',
      '- 代码给到能直接运行的最小可复现版本，不贴大段无关上下文。',
      '- 写经验，不写教程。查文档就能写出来的内容不发——那类东西 CSDN 掘金已有几百万篇。',
      '- 接口、参数、盐值一律脱敏，不指向具体平台的真实线上环境。',
      '',
      '## frontmatter 契约',
      '必填：title、date（YYYY-MM-DD）、category、excerpt',
      '可选：tags[]、cover、series、seriesTitle、seriesOrder、draft',
      '',
      '缺必填字段、category 取值错误、date 非法、slug 重复，**都会让线上构建直接失败**。',
      '',
      '## slug 规则',
      '- 小写英文 + 数字 + 单连字符，例如 sign-md5-reverse',
      '- 中文标题不要直接转写，取一个有意义的英文 slug',
      '- **发布后不可更改**：slug 是 URL 的一部分，改了等于旧链接全死、收录重来',
      '',
      '## 正文可用的 MDX 组件',
      '- `<CallChain steps={[{ fn, note, done? }]} />` 调用链，步骤是真实执行顺序',
      '- `<Compare>` 包两个代码块，并排对照（如正常请求 / 改一个字符后的响应）',
      '- `<Note>` 结论　`<Note type="warn">` 风险提示',
      '- `<Stats items={[{ label, value }]} />` 一组关键数字',
      '- 代码块支持 ```lang title="文件名" showLineNumbers，{3-5} 高亮行，/token/ 高亮词',
      '',
      '## 合规约束（重要）',
      '站点走个人 ICP 备案，**个人主体不得含经营性内容**。',
      '正文不要出现服务报价、接单入口、付费服务一类表述，',
      '也不要写「本站不承接 X」这种反向自证——那同样暗示站点在接活。',
      '',
      '## 发布后的分发顺序',
      '先发本站 → 提交搜索引擎收录 → 隔一两天再发公众号/知乎，且注明原文链接。',
      '反过来做，高权重平台会被判为原创，自己的站反而被当成转载。',
    ]
    return text(lines.join('\n'))
  },
)

server.registerTool(
  'list_taxonomy',
  {
    title: '现有栏目、标签与系列',
    description:
      '列出站点已有的栏目、标签（含使用次数）和系列。写新文章时优先复用已有标签，避免标签碎片化。',
    inputSchema: {},
  },
  async () => {
    const { categories } = await site()
    const m = await posts()
    const all = m.getAllPosts()
    const out = [
      '## 栏目',
      ...categories.map(
        (c) =>
          `- ${c.slug}（${c.label}）：${all.filter((p) => p.category === c.slug).length} 篇`,
      ),
      '',
      '## 已有标签（优先复用）',
      m
        .getAllTags()
        .map((t) => `${t.label}(${t.count})`)
        .join('　') || '（暂无）',
      '',
      '## 已有系列',
      ...(m.getAllSeries().map(
        (s) =>
          `- ${s.slug}「${s.title}」${s.posts.length} 篇，最新 seriesOrder=${Math.max(
            ...s.posts.map((p) => p.seriesOrder),
          )}`,
      ) ?? []),
    ]
    return text(out.join('\n'))
  },
)

server.registerTool(
  'list_posts',
  {
    title: '已有文章',
    description: '列出已有文章，用于避免 slug 撞车、查看已写过的主题、接续系列。',
    inputSchema: {
      category: z
        .string()
        .optional()
        .describe('可选，按栏目 slug 过滤'),
    },
  },
  async ({ category }) => {
    const m = await posts()
    const all = category
      ? m.getAllPosts().filter((p) => p.category === category)
      : m.getAllPosts()
    if (all.length === 0) return text('（没有文章）')
    return text(
      all
        .map(
          (p) =>
            `${p.date}  [${p.category}]  ${p.slug}\n    ${p.title}${
              p.draft ? '  ⚠ 草稿' : ''
            }${p.series ? `  系列:${p.series}#${p.seriesOrder}` : ''}`,
        )
        .join('\n'),
    )
  },
)

/* ------------------------------------------------------------------ *
 * 写入
 * ------------------------------------------------------------------ */

const frontmatterInput = {
  slug: z.string().describe('URL 用的英文 slug，发布后不可更改'),
  title: z.string().describe('文章标题'),
  category: z.string().describe('栏目 slug：reverse / teardown / engineering'),
  excerpt: z
    .string()
    .describe('一句话摘要，出现在列表页、RSS、搜索结果和社交卡片'),
  body: z.string().describe('MDX 正文，不含 frontmatter'),
  date: z.string().optional().describe('YYYY-MM-DD，缺省为今天（东八区）'),
  tags: z.array(z.string()).optional().describe('标签，优先复用已有的'),
  cover: z.string().optional().describe('封面图路径，如 /covers/xxx.png'),
  series: z.string().optional().describe('系列 slug'),
  seriesTitle: z.string().optional().describe('系列显示名'),
  seriesOrder: z.number().optional().describe('系列内顺序'),
}

server.registerTool(
  'draft_post',
  {
    title: '新建草稿',
    description:
      '创建一篇新文章（draft: true，不会出现在线上）。写入前会校验 slug 格式、唯一性与 frontmatter。不提交 git，可用 pnpm dev 本地预览。',
    inputSchema: frontmatterInput,
  },
  async (args) => {
    const { categories } = await site()
    const slugs = categories.map((c) => c.slug)
    const errors = checkSlug(args.slug)

    if (!slugs.includes(args.category as never)) {
      errors.push(`category "${args.category}" 不存在，可选：${slugs.join(' / ')}`)
    }
    if (!args.excerpt.trim()) errors.push('excerpt 不能为空')
    const file = postPath(args.slug)
    if (await exists(file)) errors.push(`${args.slug}.mdx 已存在，换一个 slug 或用 update_post`)
    if (errors.length) return text('❌ 校验未通过：\n- ' + errors.join('\n- '))

    const fm = buildFrontmatter({
      title: args.title,
      date: args.date ?? today(),
      category: args.category,
      excerpt: args.excerpt,
      tags: args.tags,
      cover: args.cover,
      series: args.series,
      seriesTitle: args.seriesTitle,
      seriesOrder: args.seriesOrder,
      draft: true,
    })
    await fs.mkdir(POSTS_DIR, { recursive: true })
    await fs.writeFile(file, fm + '\n' + args.body.trim() + '\n', 'utf8')

    const check = await validateAll()
    const hits = scanCommercial(args.title + args.excerpt + args.body)
    const notes = [
      `✅ 已写入 content/posts/${args.slug}.mdx（草稿，未提交）`,
      `预览：http://localhost:3000/posts/${args.slug}`,
      check.ok
        ? `站点解析通过，当前共 ${check.count} 篇`
        : `⚠ 站点解析报错，发布前必须修：${check.error}`,
    ]
    if (hits.length) {
      notes.push(
        `⚠ 正文命中经营性措辞 ${hits.join('、')}——站点走个人备案，这类表述可能导致驳回，建议改写`,
      )
    }
    return text(notes.join('\n'))
  },
)

server.registerTool(
  'update_post',
  {
    title: '修改已有文章',
    description:
      '替换已有文章的正文和/或 frontmatter 字段。slug 本身不可改——那会让线上 URL 失效。',
    inputSchema: {
      slug: z.string().describe('要修改的文章 slug'),
      body: z.string().optional().describe('新的 MDX 正文，省略则只改 frontmatter'),
      title: z.string().optional(),
      excerpt: z.string().optional(),
      category: z.string().optional(),
      tags: z.array(z.string()).optional(),
      cover: z.string().optional(),
    },
  },
  async (args) => {
    const file = postPath(args.slug)
    if (!(await exists(file))) return text(`❌ 找不到 ${args.slug}.mdx`)

    // 和 draft_post 用同一套判断：坏栏目虽然最终会被 validateAll 拦住，
    // 但那时的报错来自站点解析器，不会告诉你可选值是哪几个
    if (args.category) {
      const { categories } = await site()
      const slugs = categories.map((c) => c.slug)
      if (!slugs.includes(args.category as never)) {
        return text(`❌ category "${args.category}" 不存在，可选：${slugs.join(' / ')}`)
      }
    }

    const raw = await fs.readFile(file, 'utf8')
    const m = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(raw)
    if (!m) return text(`❌ ${args.slug}.mdx 的 frontmatter 格式异常，请手工检查`)

    // 逐行改写，保留未提及的字段和原有顺序
    const updates: Record<string, string> = {}
    if (args.title) updates.title = args.title
    if (args.excerpt) updates.excerpt = args.excerpt
    if (args.category) updates.category = args.category
    if (args.cover) updates.cover = args.cover
    if (args.tags) updates.tags = `[${args.tags.join(', ')}]`

    const fmLines = m[1].split('\n').map((line) => {
      const key = /^(\w+):/.exec(line)?.[1]
      if (key && key in updates) {
        const v = updates[key]
        delete updates[key]
        return `${key}: ${/[:#'"]/.test(v) && !v.startsWith('[') ? `'${v.replace(/'/g, "''")}'` : v}`
      }
      return line
    })
    for (const [k, v] of Object.entries(updates)) fmLines.push(`${k}: ${v}`)

    const body = args.body ? args.body.trim() + '\n' : m[2]
    await fs.writeFile(file, `---\n${fmLines.join('\n')}\n---\n\n${body.replace(/^\n+/, '')}`, 'utf8')

    const check = await validateAll()
    const notes = [
      `✅ 已更新 content/posts/${args.slug}.mdx`,
      check.ok ? `站点解析通过（${check.count} 篇）` : `⚠ 解析报错：${check.error}`,
    ]
    // draft_post 会扫，改稿这条路原先不扫——等于「先写干净再改脏」能整条绕过
    const hits = scanCommercial(
      [args.title, args.excerpt, args.body].filter(Boolean).join('\n'),
    )
    if (hits.length) {
      notes.push(
        `⚠ 改动命中经营性措辞 ${hits.join('、')}——站点走个人备案，建议改写`,
      )
    }
    return text(notes.join('\n'))
  },
)

server.registerTool(
  'validate',
  {
    title: '校验全部内容',
    description:
      '用站点自己的解析器跑一遍 content/，把会导致线上构建失败的问题提前暴露出来。',
    inputSchema: {},
  },
  async () => {
    const check = await validateAll()
    if (!check.ok) return text(`❌ 解析失败，这会让线上构建挂掉：\n${check.error}`)
    const m = await posts()
    const drafts = m.getAllPosts().filter((p) => p.draft)
    return text(
      [
        `✅ 解析通过，共 ${check.count} 篇`,
        drafts.length
          ? `草稿 ${drafts.length} 篇（不会出现在线上）：${drafts.map((d) => d.slug).join('、')}`
          : '没有草稿',
      ].join('\n'),
    )
  },
)

/* ------------------------------------------------------------------ *
 * 发布
 * ------------------------------------------------------------------ */

server.registerTool(
  'publish_post',
  {
    title: '发布文章',
    description:
      '把草稿转正（draft: false），校验后提交并推送，触发 Vercel 部署。这一步会让文章立刻对外可见。',
    inputSchema: {
      slug: z.string().describe('要发布的文章 slug'),
      message: z.string().optional().describe('自定义提交信息，缺省用「发布：标题」'),
      allowCommercial: z
        .boolean()
        .optional()
        .describe(
          '确认经营性措辞是误报时置 true，跳过该检查。缺省 false，命中即中止发布。',
        ),
    },
    /*
     * destructiveHint 标 true：这个动作会推送到生产、立刻对外可见，
     * 且不是幂等的。MCP 客户端靠这个标记决定调用前要不要征求确认——
     * 标成 false 会让它被当成安全操作直接执行。
     */
    annotations: {
      destructiveHint: true,
      idempotentHint: false,
      openWorldHint: true,
      readOnlyHint: false,
    },
  },
  async ({ slug, message, allowCommercial }) => {
    const file = postPath(slug)
    if (!(await exists(file))) return text(`❌ 找不到 ${slug}.mdx`)

    // 暂存区若有别的改动，提交会把它们一并带上——宁可报错让人自己处理
    const staged = (await stagedFiles()).filter(
      (f) => f !== path.relative(REPO, file),
    )
    if (staged.length) {
      return text(
        `❌ 暂存区还有其他改动，发布会把它们一起提交：\n- ${staged.join('\n- ')}\n请先处理干净再发布。`,
      )
    }

    const raw = await fs.readFile(file, 'utf8')

    /*
     * 经营性措辞必须拦在 push 之前。draft_post 那里只是提示就够了——草稿还能改；
     * 到了这里推完就对外可见，事后提示没有意义。
     * 站点走个人 ICP 备案，个人主体不得含经营性内容，这是唯一真会导致驳回的检查项。
     * 正则难免误报（讲定价的文章本来就会出现「付费」），所以给一个显式放行开关，
     * 而不是默认放过。
     */
    if (!allowCommercial) {
      const hits = scanCommercial(raw)
      if (hits.length) {
        return text(
          `❌ 命中经营性措辞 ${hits.join('、')}，已中止发布。\n` +
            '站点走个人 ICP 备案，个人主体不得含经营性内容。\n' +
            '确认是误报的话，带 allowCommercial: true 重新调用。',
        )
      }
    }

    const published = raw.replace(/^draft:\s*true\s*$/m, 'draft: false')
    if (published !== raw) await fs.writeFile(file, published, 'utf8')

    const check = await validateAll()
    if (!check.ok) {
      // 已经把 draft 翻成 false 了，中止时要还原，否则本地留下一篇
      // 「不是草稿又没发布」的文章，下次 build 会把它带上线
      if (published !== raw) await fs.writeFile(file, raw, 'utf8')
      return text(`❌ 校验未通过，已中止发布（否则线上构建会挂）：\n${check.error}`)
    }

    const m = await posts()
    const post = m.getAllPosts().find((p) => p.slug === slug)
    if (!post) return text(`❌ ${slug} 写入后仍未被解析到，请检查 frontmatter`)

    const rel = path.relative(REPO, file)
    const branch = await currentBranch()
    await git('add', '--', rel)
    await git('commit', '-m', message ?? `发布：${post.title}`, '--', rel)
    await git('push')
    const sha = await git('rev-parse', '--short', 'HEAD')
    const { site: cfg } = await site()

    return text(
      [
        `✅ 已发布　${sha}　分支 ${branch}`,
        `https://${cfg.domain}/posts/${slug}`,
        'Vercel 正在构建，通常几十秒后生效。',
        '',
        '下一步：提交搜索引擎收录，隔一两天再发公众号/知乎并注明原文链接。',
      ].join('\n'),
    )
  },
)

await server.connect(new StdioServerTransport())
