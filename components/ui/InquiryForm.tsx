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
      className="border border-brand bg-brand py-2.5 font-mono text-[12.5px] font-medium text-bg transition-opacity hover:opacity-88 disabled:opacity-60"
    >
      {pending ? '提交中…' : '发送'}
    </button>
  )
}

const field =
  'w-full border border-line bg-bg px-3 py-2 text-[13.5px] text-ink outline-none transition-colors placeholder:text-faint focus:border-brand'

export function InquiryForm() {
  const [state, action] = useActionState<InquiryState, FormData>(
    submitInquiry,
    null,
  )

  return (
    <form action={action} className="flex flex-col gap-3">
      <div>
        <label htmlFor="name" className="tag-line mb-1.5 block text-faint">
          称呼
        </label>
        <input id="name" name="name" className={field} placeholder="张三" />
      </div>
      <div>
        <label htmlFor="contact" className="tag-line mb-1.5 block text-faint">
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
        <label htmlFor="detail" className="tag-line mb-1.5 block text-faint">
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
            state.ok ? 'text-[13px] text-pass' : 'text-[13px] text-fail'
          }
        >
          {state.message}
        </p>
      ) : null}
    </form>
  )
}
