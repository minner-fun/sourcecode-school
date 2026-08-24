/**
 * 工具页清单。小工具是这个方向自然外链和回访的主要来源，
 * 同时顺带证明前端能力，所以单独作为一个栏目维护。
 */
export const tools = [
  {
    slug: 'curl-to-python',
    title: 'curl 转 Python requests',
    desc: '把浏览器或抓包工具复制出来的 curl 命令转成可直接运行的 requests 代码，自动拆出 headers、cookies 与请求体。',
    status: 'ready',
  },
  {
    slug: 'timestamp',
    title: '时间戳转换',
    desc: '秒/毫秒时间戳与日期互转，带常见时区。',
    status: 'planned',
  },
  {
    slug: 'js-deobfuscate',
    title: 'JS 反混淆（AST）',
    desc: '常量折叠、字符串数组还原、控制流平坦化展开。',
    status: 'planned',
  },
  {
    slug: 'crypto',
    title: '常用加解密',
    desc: 'MD5 / SHA 系列、Base64、AES、RSA 的在线计算与校验。',
    status: 'planned',
  },
] as const
