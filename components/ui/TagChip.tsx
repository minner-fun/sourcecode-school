import Link from 'next/link'

export function TagChip({
  label,
  count,
}: {
  label: string
  count?: number
}) {
  return (
    <Link
      href={`/tags/${encodeURIComponent(label)}`}
      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-line px-2.5 py-1 text-xs text-muted transition-colors hover:border-brand hover:text-brand"
    >
      {label}
      {count !== undefined ? (
        <span className="font-mono text-faint">{count}</span>
      ) : null}
    </Link>
  )
}
