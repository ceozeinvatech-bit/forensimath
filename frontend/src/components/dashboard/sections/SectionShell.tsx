import type { ReactNode } from 'react'

type SectionShellProps = {
  title: string
  subtitle: string
  action?: ReactNode
  children: ReactNode
}

export default function SectionShell({ title, subtitle, action, children }: SectionShellProps) {
  return (
    <section className="flex h-full flex-col rounded-2xl border border-forensic-border/80 bg-white/5 shadow-[0_20px_48px_rgba(2,6,23,0.24)] backdrop-blur-xl">
      <header className="flex flex-col gap-3 border-b border-forensic-border/80 bg-gradient-to-r from-forensic-panel/80 to-forensic-surface/70 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-forensic-amber">
            {title}
          </p>
          <h2 className="mt-1 text-lg font-semibold text-forensic-text sm:text-xl">{subtitle}</h2>
        </div>
        {action}
      </header>
      <div className="flex-1 overflow-auto p-4 sm:p-6">{children}</div>
    </section>
  )
}
