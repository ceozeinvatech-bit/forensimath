import type { ReactNode } from 'react'

type SectionPanelProps = {
  title: string
  subtitle?: string
  children: ReactNode
}

export default function SectionPanel({
  title,
  subtitle,
  children,
}: SectionPanelProps) {
  return (
    <section className="flex h-full flex-col border border-forensic-border bg-forensic-panel/60">
      <header className="border-b border-forensic-border px-4 py-3 sm:px-6 sm:py-4">
        <h2 className="font-[family-name:var(--font-mono)] text-sm tracking-[0.15em] text-forensic-amber uppercase sm:text-base">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-1 text-xs text-forensic-muted sm:text-sm">{subtitle}</p>
        )}
      </header>
      <div className="flex flex-1 flex-col items-center justify-center p-6 sm:p-10">
        {children}
      </div>
    </section>
  )
}
