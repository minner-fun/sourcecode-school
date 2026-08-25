export function SectionTitle({
  children,
  action,
}: {
  children: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <div className="mb-1 flex items-baseline gap-4 border-b border-ink pb-2.5">
      <h2 className="tag-line m-0">{children}</h2>
      {action ? <div className="ml-auto">{action}</div> : null}
    </div>
  )
}
