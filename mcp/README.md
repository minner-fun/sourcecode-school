# 发布 MCP 服务器

给写作侧的 Claude Code 用的发布通道。把站点的写作契约和「写文件 → 校验 → 提交 → 推送」
这套动作封装成 MCP 工具，写文章时不必每次重新交代站点规矩。

## 在写作项目里接上

在写作项目根目录建 `.mcp.json`：

```json
{
  "mcpServers": {
    "sourcecode-school": {
      "command": "node",
      "args": ["/home/minner/Codes/opc/sorcecode-school/mcp/server.ts"],
      "env": {
        "SITE_REPO": "/home/minner/Codes/opc/sorcecode-school"
      }
    }
  }
}
```

`SITE_REPO` 可省略——缺省取 `mcp/` 的上一级目录。从别处调用时才需要显式指定。

不需要构建：Node 24 直接执行 `.ts`（原生类型剥离）。

## 工具

| 工具 | 作用 |
| --- | --- |
| `get_writing_guide` | 栏目划分、写作标准、frontmatter 契约、可用 MDX 组件、合规约束。**写之前先调这个** |
| `list_taxonomy` | 现有栏目、标签（含次数）、系列。用于复用标签、接续系列 |
| `list_posts` | 已有文章，避免 slug 撞车 |
| `draft_post` | 新建草稿（`draft: true`），校验后落盘，**不碰 git** |
| `update_post` | 改已有文章的正文或 frontmatter |
| `validate` | 用站点自己的解析器跑一遍，提前暴露会让线上构建失败的问题 |
| `publish_post` | 转正、提交、推送，触发部署。**会立刻对外可见** |

## 典型流程

```
get_writing_guide → list_taxonomy → draft_post
  → pnpm dev 本地预览 → update_post 改到满意 → publish_post
```

草稿只存在本地工作区，不提交。发布是一篇一个提交。

## 两个设计要点

**校验规则不在这里重写。** 全部复用站点的 `lib/posts.ts` 和 `lib/site.ts`
（Node 能直接导入 `.ts`）。站点改栏目或 frontmatter 契约，MCP 自动跟着变，
不会出现两份 schema 对不上的情况。

代价是得跟着它的约定走：`lib/posts.ts` 用 `process.cwd()` 定位 `content/posts`
（对 Next 是对的，构建在仓库根跑），而 MCP 是被写作项目拉起的、cwd 在别处。
所以 `mcp/lib.ts` 启动时 `process.chdir(REPO)`。**漏掉这步的症状很隐蔽**：
写入走 `REPO` 正常，读取走 cwd 全空——`validate` 永远报「共 0 篇」看着像通过，
`publish_post` 则卡在「写入后仍未被解析到」，每次发布都失败。

**`publish_post` 标了 `destructiveHint`。** 它推送到生产、立刻对外可见且不幂等，
客户端应当在调用前征求确认。开发这个服务器时就因为标错成 `false`
误发布过一篇测试文章。

## 安全约束

- 提交前检查暂存区：有无关的已暂存改动时拒绝发布，避免把半截代码一起提交
- 推送前强制跑一遍校验：缺字段 / 栏目错 / 日期非法 / slug 重复都会中止，
  否则 Vercel 构建会直接失败
- 正文扫描经营性措辞（接单、报价、付费……）：站点走个人 ICP 备案，
  个人主体不得含经营性内容。**`draft_post` / `update_post` 命中只提示**（草稿还能改），
  **`publish_post` 命中直接中止**——推完就对外可见，事后提示没有意义。
  正则难免误报（讲定价的文章本来就会出现「付费」），确认误报时带 `allowCommercial: true` 放行
- `publish_post` 校验失败会把已翻成 `draft: false` 的改动还原，
  不留下「不是草稿又没发布」的文件（否则下次构建会把它带上线）
- **正文引用的本地资源随文章一起提交**，不会出现「文章上线了、图还在本地」。
  引用了 `public/` 下不存在的文件时 `publish_post` 直接中止——那种 404
  构建不报错，得等人打开页面才发现。`draft_post` / `update_post` 阶段只提示。

  认三种写法：`![](/figures/x.png)`、`src="/figures/x.png"`、frontmatter 的
  `cover:`。站内页面链接 `[看这篇](/posts/foo)` 不会被误判成资源，
  外链和 `data:` 也会跳过。
