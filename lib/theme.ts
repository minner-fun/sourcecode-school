/**
 * 配色相关的共享常量。
 *
 * 刻意放在普通模块里而不是 ThemeToggle.tsx：那个文件带 'use client'，
 * 服务端组件从客户端模块 import 非组件的值，拿到的是客户端引用代理而不是真实值，
 * 拼进防闪脚本会变成 undefined，而且不报错。
 */
export const SCHEME_STORAGE_KEY = 'scheme'

export type Scheme = 'auto' | 'light' | 'dark'
