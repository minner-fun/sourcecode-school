export function SectionTitle({
  children,
  action,
}: {
  children: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <div className="mb-5 flex items-baseline gap-3.5">
      <h2 className="m-0 text-[13px] font-medium uppercase tracking-[0.1em] text-brand">
        {children}
      </h2>
      <span className="h-px flex-1 bg-gradient-to-r from-line to-transparent" />
      {action}
    </div>
  )
}
