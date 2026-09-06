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
| `publish_post` | 转正、提交、推送，等页面上线后推 IndexNow。**会立刻对外可见** |
| `draft_to_wechat` | 把已发布的文章送进公众号草稿箱。**不发布** |

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

## IndexNow

发布后主动把新地址推给 Bing / Yandex。

搜索引擎这块到此为止：Google 靠 Search Console 提交的 sitemap，
Bing / Yandex 靠 IndexNow 实时推。**百度已放弃**——站点未备案且部署在
海外节点，百度对这类站压权重，收录概率低到不值得为它单独做一套推送。
新域名的自然抓取频率很低，靠引擎自己来爬 sitemap 要等几天。

放在 MCP 而不是站点里，是因为站点全静态、构建完就没有运行时，
没有「部署完成」这个钩子；而 MCP 恰好知道刚发的是哪一篇。

**顺序很关键**：`git push` 之后先轮询等页面真的能取到（最多 150s），再推送。
反过来做的话引擎抓到的是构建期间的 404 —— 比不推更糟，它会把这个 URL
记成坏的。等不到就跳过推送并提示去看 Vercel，而不是硬推。

推送的地址是文章本身，加上内容因它而变的列表页（首页 / 归档 / 栏目 / 系列）。
标签页不推：一篇能带出好几个，价值低，交给 sitemap 常规抓取。

密钥在 `lib/site.ts` 的 `indexNowKey`，同时以 `public/<key>.txt` 公开托管
——协议就是这么做所有权校验的，所以它进仓库是正确的，不是泄密。
**换 key 要同时改这两处**，发布前会核对，对不上就跳过推送并说明原因。

不想推时带 `skipIndexNow: true`（改错别字之类），省约一分钟。

## 公众号草稿箱

`draft_to_wechat <slug>`：转 HTML → 正文图片传到微信 → 生成封面 → 建草稿。
**只到草稿箱**，群发不可逆且每天有次数上限，那一步在后台手动点。

凭据放在 `~/.config/wechat-mp.env`（`APP_ID` / `APP_SECRET`，`chmod 600`），
不进仓库、不写日志。

两个环境约束，缺一个都会 `40164`：

- **必须走 IPv4**。本机直连默认解析到 IPv6，而微信白名单只收 IPv4。
  代码里 `dns.setDefaultResultOrder('ipv4first')` 放在模块顶层。
- **必须绕开代理**。走 clash 时出口是境外节点，和白名单里的地址对不上。
  Node 的 fetch 本来就不读 `HTTP_PROXY`，实测确认过。

换网络环境要重新加白名单：`curl -s -4 --noproxy '*' https://ipv4.icanhazip.com`。

### 它的过滤器会改你的 HTML

这几条都是实际发到草稿箱才看出来的，本地浏览器里全都正常：

1. **`class` 属性会被剥掉** —— 任何靠 class 的样式都得内联。shiki 靠
   `<span class="line">` 分行，不处理就整块挤成一行。
2. **`<ul>` 里的游离空白会变成空列表项** —— `</li>` 和 `<li>` 之间的换行
   会让每条参考文献前面多一个空 bullet。列表标签之间不能留空白。
3. **正文默认两端对齐** —— 「文字（长地址）」断不开，只能靠拉伸词间空格
   对齐，看起来字距奇大。`p` / `li` 要显式 `text-align:left`。
4. **同名属性重复时结果不确定** —— 往 `<pre>` 里插 style 会和 shiki 自带的
   并存成两个，现在整个开标签换掉合并成一个。

修法都在 `scripts/export-post.mjs`，转换规则只有那一份。

### 封面

直接取站点自己生成的 OG 分享图（`/posts/<slug>/opengraph-image`，
由 `lib/og-card.tsx` 按标题渲染 1200×630）。

**不另做一套。** 一度用 headless Chrome 截了个专用模板，后来发现站点已经
有这张图了 —— 两套视觉要同步维护，迟早走样。1200×630 是 1.90:1，
公众号列表按 2.35:1 居中裁，卡片上下留白足够，品牌行和页脚都在裁切范围内。

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
