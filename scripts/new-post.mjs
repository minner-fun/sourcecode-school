#!/usr/bin/env node
/**
 * 新建一篇文章：pnpm new "标题" [栏目]
 * 栏目取 reverse | engineering | news，缺省 reverse。
 */
import fs from 'node:fs'
import path from 'node:path'

// 这是开发期脚本；提前声明可以避免 lib/site.ts 在加载时打出生产环境的域名告警
process.env.NODE_ENV ||= 'development'

// 栏目列表从 lib/site.ts 读，不在这里再抄一份——抄了迟早和站点定义脱节
const { categories } = await import('../lib/site.ts')
const slugs = categories.map((c) => c.slug)

const [, , title, category = slugs[0]] = process.argv

if (!title) {
  console.error(`用法: pnpm new "文章标题" [${slugs.join('|')}]`)
  process.exit(1)
}
if (!slugs.includes(category)) {
  console.error(`栏目 "${category}" 不存在，可选：${slugs.join(' / ')}`)
  process.exit(1)
}

// 中文标题不适合直接做 slug，这里只保留标题里的英文与数字，
// 其余情况留一个占位让作者自己改成有意义的英文 slug。
const auto = title
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '')
const slug = auto.length >= 3 ? auto : 'untitled-' + Date.now().toString(36)

const date = new Date().toLocaleDateString('sv-SE', {
  timeZone: 'Asia/Shanghai',
})

const file = path.join(process.cwd(), 'content', 'posts', `${slug}.mdx`)
if (fs.existsSync(file)) {
  console.error(`已存在同名文件：${file}`)
  process.exit(1)
}

fs.writeFileSync(
  file,
  `---
title: ${title}
date: ${date}
category: ${category}
tags: []
excerpt: 一句话说清这篇解决什么问题。这段会出现在列表页、RSS 和搜索结果里。
# cover: /covers/${slug}.png
# series: some-series
# seriesTitle: 系列名
# seriesOrder: 1
draft: true
---

## 第一节

正文。可用组件：

<CallChain steps={[
  { fn: 'entry()', note: '第一步' },
  { fn: 'done()', note: '收尾', done: true },
]} />

<Note>
需要强调的结论写这里。
</Note>
`,
  'utf8',
)

console.log(`已创建 content/posts/${slug}.mdx`)
console.log('slug 是 URL 的一部分，发布后不要再改。中文标题请手工改成有意义的英文 slug。')
