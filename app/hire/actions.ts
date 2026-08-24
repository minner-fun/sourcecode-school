'use server'

/**
 * 需求表单提交。
 *
 * 默认把内容 POST 到 INQUIRY_WEBHOOK_URL（企业微信/飞书机器人、自建接口都行），
 * 没配这个环境变量时只在服务端日志里打印，方便本地先跑通。
 *
 * 注意：next.config.ts 里若打开 output: 'export'，Server Action 不可用，
 * 那种部署方式下请把表单换成纯联系方式展示。
 */
export type InquiryState = { ok: boolean; message: string } | null

export async function submitInquiry(
  _prev: InquiryState,
  formData: FormData,
): Promise<InquiryState> {
  const name = String(formData.get('name') ?? '').trim()
  const contact = String(formData.get('contact') ?? '').trim()
  const detail = String(formData.get('detail') ?? '').trim()
  // 蜜罐字段：正常用户看不到也不会填，填了的直接丢弃
  const trap = String(formData.get('company') ?? '').trim()

  if (trap) return { ok: true, message: '已收到，我会尽快回复。' }
  if (!contact || !detail) {
    return { ok: false, message: '联系方式和需求说明都要填一下。' }
  }
  if (detail.length > 4000 || contact.length > 200 || name.length > 100) {
    return { ok: false, message: '内容过长，请精简后再提交。' }
  }

  const payload = {
    name: name || '（未填）',
    contact,
    detail,
    at: new Date().toISOString(),
  }

  const webhook = process.env.INQUIRY_WEBHOOK_URL
  if (!webhook) {
    console.info('[inquiry] 未配置 INQUIRY_WEBHOOK_URL，仅记录：', payload)
    return { ok: true, message: '已收到，我会尽快回复。' }
  }

  try {
    const res = await fetch(webhook, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) throw new Error(`webhook ${res.status}`)
    return { ok: true, message: '已收到，我会尽快回复。' }
  } catch (error) {
    // 不把内部错误暴露给访客，但要在日志里留下线索，否则线索就真丢了
    console.error('[inquiry] 转发失败：', error, payload)
    return {
      ok: false,
      message: '提交没走通，麻烦直接加微信或发邮件，抱歉。',
    }
  }
}
