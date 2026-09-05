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

**`publish_post` 标了 `destructiveHint`。** 它推送到生产、立刻对外可见且不幂等，
客户端应当在调用前征求确认。开发这个服务器时就因为标错成 `false`
误发布过一篇测试文章。

## 安全约束

- 提交前检查暂存区：有无关的已暂存改动时拒绝发布，避免把半截代码一起提交
- 推送前强制跑一遍校验：缺字段 / 栏目错 / 日期非法 / slug 重复都会中止，
  否则 Vercel 构建会直接失败
- 正文扫描经营性措辞（接单、报价、付费……）：站点走个人 ICP 备案，
  个人主体不得含经营性内容。命中不阻断发布，但会提示
