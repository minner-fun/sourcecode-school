'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { submitInquiry, type InquiryState } from '@/app/hire/actions'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-brand py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
    >
      {pending ? '提交中…' : '发送'}
    </button>
  )
}

const field =
  'w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none transition-colors placeholder:text-faint focus:border-brand'

export function InquiryForm() {
  const [state, action] = useActionState<InquiryState, FormData>(
    submitInquiry,
    null,
  )

  return (
    <form action={action} className="flex flex-col gap-3">
      <div>
        <label htmlFor="name" className="mb-1.5 block text-xs text-ink-soft">
          称呼
        </label>
        <input id="name" name="name" className={field} placeholder="张三" />
      </div>
      <div>
        <label htmlFor="contact" className="mb-1.5 block text-xs text-ink-soft">
          联系方式
        </label>
        <input
          id="contact"
          name="contact"
          required
          className={field}
          placeholder="微信 / 邮箱"
        />
      </div>
      <div>
        <label htmlFor="detail" className="mb-1.5 block text-xs text-ink-soft">
          需求说明
        </label>
        <textarea
          id="detail"
          name="detail"
          required
          rows={4}
          className={`${field} resize-y`}
          placeholder="目标平台、需要的字段、数据量、时间要求"
        />
      </div>

      {/* 蜜罐，挡掉最基础的表单机器人 */}
      <input
        type="text"
        name="company"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
        className="absolute left-[-9999px] size-px"
      />

      <SubmitButton />

      {state ? (
        <p
          role="status"
          className={
            state.ok ? 'text-[13px] text-brand' : 'text-[13px] text-amber'
          }
        >
          {state.message}
        </p>
      ) : null}
    </form>
  )
}
