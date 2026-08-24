#!/usr/bin/env node
/**
 * 一稿多发：把一篇 MDX 导出成公众号和知乎能直接用的形态。
 *
 *   pnpm export:post <slug>        导出单篇
 *   pnpm export:post --all         导出全部
 *
 * 产物在 export-out/：
 *   <slug>.wechat.html  —— 全内联样式，粘进公众号编辑器即可，样式不会掉
 *   <slug>.zhihu.md     —— 纯 markdown，知乎/掘金/CSDN 通用
 *
 * 站点自定义组件（CallChain / Compare / Note / Stats）会降级成
 * 有序列表、引用块这些各平台都认的原生结构。
 */
import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import { visit } from 'unist-util-visit'
import { codeToHtml } from 'shiki'

const ROOT = process.cwd()
const POSTS_DIR = path.join(ROOT, 'content', 'posts')
const OUT_DIR = path.join(ROOT, 'export-out')

/* ------------------------------------------------------------------
 * 自定义组件 → 原生 markdown
 * ---------------------------------------------------------------- */

/**
 * 解析 JSX 属性里的 JS 字面量（单引号、无引号键名，不是合法 JSON）。
 * 内容来自本仓库、脚本在本地跑，这里用 Function 求值是可接受的；
 * 不要把这个脚本指向任何外部来源的 MDX。
 */
function evalLiteral(expression, context) {
  try {
    return Function(`"use strict"; return (${expression});`)()
  } catch (error) {
    throw new Error(`${context} 的属性解析失败: ${error.message}`)
  }
}

function transformComponents(body, slug) {
  let out = body

  out = out.replace(
    /<CallChain\s+steps=\{([\s\S]*?)\}\s*\/>/g,
    (_, expr) => {
      const steps = evalLiteral(expr, `${slug} 的 CallChain`)
      const lines = steps.map(
        (s, i) => `${i + 1}. \`${s.fn}\` —— ${s.note}`,
      )
      return `**调用链：**\n\n${lines.join('\n')}\n`
    },
  )

  out = out.replace(/<Stats\s+items=\{([\s\S]*?)\}\s*\/>/g, (_, expr) => {
    const items = evalLiteral(expr, `${slug} 的 Stats`)
    return items.map((i) => `- **${i.label}**：${i.value}`).join('\n') + '\n'
  })

  out = out.replace(
    /<Note(?:\s+type="(\w+)")?\s*>([\s\S]*?)<\/Note>/g,
    (_, type, inner) => {
      const prefix = type === 'warn' ? '⚠️ ' : ''
      const text = inner.trim().split('\n').map((l) => `> ${l}`).join('\n')
      return `${prefix ? `> ${prefix}\n` : ''}${text}\n`
    },
  )

  // Compare 只是并排布局，导出时拆开顺序排列即可
  out = out.replace(/<\/?Compare\s*>/g, '')

  const leftover = out.match(/<[A-Z][A-Za-z]*[\s/>]/)
  if (leftover) {
    console.warn(
      `  ! ${slug} 里还有未处理的组件 ${leftover[0].trim()}，导出结果会带原始标签`,
    )
  }

  return out.replace(/\n{3,}/g, '\n\n').trim()
}

/* ------------------------------------------------------------------
 * 公众号 HTML：全内联样式
 * ---------------------------------------------------------------- */

const INLINE = {
  p: 'font-size:16px;line-height:1.85;margin:1.1em 0;color:#3f4650;',
  h2: 'font-size:20px;font-weight:600;line-height:1.5;margin:2em 0 .8em;color:#16191d;border-left:4px solid #1f5eda;padding-left:12px;',
  h3: 'font-size:17px;font-weight:600;line-height:1.5;margin:1.6em 0 .6em;color:#16191d;',
  ul: 'padding-left:1.4em;margin:1.1em 0;',
  ol: 'padding-left:1.4em;margin:1.1em 0;',
  li: 'font-size:16px;line-height:1.85;margin:.35em 0;color:#3f4650;',
  blockquote:
    'border-left:3px solid #1f5eda;background:#f4f7fe;padding:.9em 1.1em;margin:1.4em 0;color:#3f4650;font-size:15px;line-height:1.8;',
  strong: 'font-weight:600;color:#16191d;',
  table:
    'width:100%;border-collapse:collapse;margin:1.4em 0;font-size:14px;',
  th: 'border:1px solid #e4e7ec;padding:8px 12px;background:#f7f8fa;text-align:left;font-weight:600;color:#16191d;',
  td: 'border:1px solid #e4e7ec;padding:8px 12px;color:#3f4650;',
  hr: 'border:0;border-top:1px solid #e4e7ec;margin:2.2em 0;',
  img: 'max-width:100%;height:auto;border-radius:8px;',
}

/** 行内 code，和代码块区分开 */
const INLINE_CODE =
  'background:#f2f4f7;border-radius:3px;padding:2px 5px;font-size:14px;color:#a4560c;font-family:Consolas,Monaco,monospace;'

function rehypeWechat() {
  return async (tree) => {
    const codeBlocks = []

    visit(tree, 'element', (node, index, parent) => {
      // 代码块：交给 shiki 出内联样式，先收集，稍后统一异步处理
      if (node.tagName === 'pre') {
        const code = node.children.find((c) => c.tagName === 'code')
        if (code) {
          const lang =
            (code.properties?.className ?? [])
              .map(String)
              .find((c) => c.startsWith('language-'))
              ?.slice('language-'.length) ?? 'text'
          const text = code.children.map((c) => c.value ?? '').join('')
          codeBlocks.push({ node, lang, text })
          return
        }
      }

      if (node.tagName === 'code') {
        node.properties = { ...node.properties, style: INLINE_CODE }
        return
      }

      // 公众号正文不允许外链，链接降级成「文字（地址）」
      if (node.tagName === 'a' && parent && typeof index === 'number') {
        const href = String(node.properties?.href ?? '')
        const label = node.children.map((c) => c.value ?? '').join('')
        const external = /^https?:/.test(href)
        parent.children.splice(index, 1, {
          type: 'text',
          value: external && href !== label ? `${label}（${href}）` : label,
        })
        return
      }

      const style = INLINE[node.tagName]
      if (style) {
        node.properties = { ...node.properties, style }
      }
    })

    for (const block of codeBlocks) {
      const html = await codeToHtml(block.text, {
        lang: block.lang,
        theme: 'github-light',
      })
      // shiki 自带 background-color，再补一层边框和内边距
      block.node.type = 'raw'
      block.node.value = html.replace(
        '<pre class="shiki',
        '<pre style="border:1px solid #e4e7ec;border-radius:8px;padding:14px 16px;overflow-x:auto;font-size:13px;line-height:1.7;margin:1.4em 0;" class="shiki',
      )
      block.node.children = []
    }
  }
}

async function toWechatHtml(markdown, title) {
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeWechat)
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(markdown)

  return `<section style="font-family:-apple-system,'PingFang SC','Microsoft YaHei',sans-serif;color:#3f4650;">
<h1 style="font-size:22px;font-weight:600;line-height:1.4;margin:0 0 1.2em;color:#16191d;">${title}</h1>
${String(file)}
</section>
`
}

/* ------------------------------------------------------------------
 * 入口
 * ---------------------------------------------------------------- */

async function exportOne(slug) {
  const file = path.join(POSTS_DIR, `${slug}.mdx`)
  if (!fs.existsSync(file)) throw new Error(`找不到 content/posts/${slug}.mdx`)

  const { data, content } = matter(fs.readFileSync(file, 'utf8'))
  const markdown = transformComponents(content, slug)

  fs.mkdirSync(OUT_DIR, { recursive: true })

  const zhihu = `# ${data.title}\n\n${data.excerpt}\n\n${markdown}\n`
  fs.writeFileSync(path.join(OUT_DIR, `${slug}.zhihu.md`), zhihu, 'utf8')

  const wechat = await toWechatHtml(
    `${data.excerpt}\n\n${markdown}`,
    data.title,
  )
  fs.writeFileSync(path.join(OUT_DIR, `${slug}.wechat.html`), wechat, 'utf8')

  console.log(`  ✓ ${slug}`)
}

const arg = process.argv[2]
if (!arg) {
  console.error('用法: pnpm export:post <slug> | --all')
  process.exit(1)
}

const slugs =
  arg === '--all'
    ? fs
        .readdirSync(POSTS_DIR)
        .filter((f) => f.endsWith('.mdx'))
        .map((f) => f.replace(/\.mdx$/, ''))
    : [arg]

console.log(`导出 ${slugs.length} 篇到 export-out/`)
for (const slug of slugs) {
  await exportOne(slug)
}
console.log('公众号：用浏览器打开 .wechat.html，全选复制，粘进公众号编辑器。')
