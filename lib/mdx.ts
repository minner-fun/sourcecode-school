import rehypeSlug from 'rehype-slug'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import rehypePrettyCode, { type Options as PrettyCodeOptions } from 'rehype-pretty-code'
import remarkGfm from 'remark-gfm'
import type { MDXRemoteProps } from 'next-mdx-remote/rsc'

const prettyCode: PrettyCodeOptions = {
  // 双主题：shiki 把两套颜色写成 --shiki-light / --shiki-dark，
  // 由 globals.css 里的 prefers-color-scheme 决定用哪一套，不需要客户端 JS。
  theme: { light: 'one-light', dark: 'one-dark-pro' },
  // 背景交给我们自己的 CSS，保证代码块和站点其余卡片同色
  keepBackground: false,
  defaultLang: { block: 'text', inline: 'text' },
}

/** 文章正文与导出脚本共用同一套 remark/rehype 配置 */
export const mdxOptions: MDXRemoteProps['options'] = {
  /*
   * next-mdx-remote v6 默认开启 blockJS，会把 MDX 里所有 JS 表达式剥掉，
   * 包括 <CallChain steps={[...]} /> 这种属性表达式——而且是静默丢弃，
   * 组件拿到的是 undefined。那个默认值是给「渲染远端不可信 MDX」准备的，
   * 本站文章来自本仓库 content/，属于第一方内容，所以关掉。
   * blockDangerousJS 保持默认开启，仍然挡掉 eval / process 这类调用。
   */
  blockJS: false,
  mdxOptions: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [
      rehypeSlug,
      [
        rehypeAutolinkHeadings,
        {
          behavior: 'append',
          properties: { className: ['heading-anchor'], ariaLabel: '本节链接' },
          content: { type: 'text', value: '#' },
        },
      ],
      [rehypePrettyCode, prettyCode],
    ],
  },
}
