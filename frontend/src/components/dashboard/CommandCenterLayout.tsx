import { useState } from 'react'
import type { ReactNode } from 'react'
import SidebarNav from './SidebarNav'
import EducationalBanner from './EducationalBanner'
import ThemeToggle from '../ui/ThemeToggle'
import CaseModal from './sections/CaseModal'
import { useInvestigationStore } from '../../store/investigationStore'

type CommandCenterLayoutProps = {
  children: ReactNode
  activeNavItem?: string
  onNavSelect?: (item: string) => void
}

export default function CommandCenterLayout({
  children,
  activeNavItem,
  onNavSelect,
}: CommandCenterLayoutProps) {
  const activeCase = useInvestigationStore((state) => state.activeCase)
  const [modalMode, setModalMode] = useState<'create' | 'open' | null>(null)

  return (
    <div className="flex min-h-svh flex-col bg-forensic-bg">
      <header className="border-b border-forensic-border/80 bg-forensic-panel/80 shadow-[0_12px_40px_rgba(2,6,23,0.28)] backdrop-blur-xl">
        <div className="flex flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:justify-between lg:px-6 lg:py-4">
          <div>
            <h1 className="text-lg font-semibold uppercase tracking-[0.3em] text-forensic-amber sm:text-xl" style={{ fontFamily: 'Inter, Segoe UI, Roboto, sans-serif' }}>
              FORENSIMATH
            </h1>
            <p className="mt-1 text-xs font-medium text-forensic-text/80 sm:text-sm">
              Evidence Intelligence
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="rounded-xl border border-forensic-border/80 bg-gradient-to-br from-forensic-surface/80 to-forensic-panel/75 px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:px-4">
              <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-forensic-text/75">
                Case
              </p>
              <p className="mt-1 text-sm font-semibold text-forensic-text">{activeCase}</p>
            </div>
            <button
              type="button"
              onClick={() => setModalMode('create')}
              className="cursor-pointer rounded-xl border border-forensic-amber/60 bg-forensic-amber px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-forensic-bg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(247,184,74,0.25)]"
            >
              New Case
            </button>
            <button
              type="button"
              onClick={() => setModalMode('open')}
              className="cursor-pointer rounded-xl border border-forensic-border/80 bg-white/8 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-forensic-text backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:border-forensic-accent/60 hover:bg-forensic-surface/80 hover:text-forensic-text"
            >
              Open Case
            </button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="hidden w-52 shrink-0 border-r border-forensic-border/80 bg-forensic-panel/45 py-4 shadow-[inset_-1px_0_0_rgba(255,255,255,0.03)] md:block lg:w-56">
          <SidebarNav activeItem={activeNavItem} onSelect={onNavSelect} />
        </aside>

        <main className="relative flex flex-1 flex-col overflow-auto">
          <div className="absolute inset-0 forensic-grid-bg opacity-30" />

          <div className="relative border-b border-forensic-border bg-forensic-panel/60 py-2 md:hidden">
            <SidebarNav
              activeItem={activeNavItem}
              onSelect={onNavSelect}
              variant="horizontal"
            />
          </div>

          <div className="relative flex-1 p-4 sm:p-6">{children}</div>
        </main>
      </div>

      <EducationalBanner />
      {modalMode && <CaseModal isOpen={Boolean(modalMode)} mode={modalMode} onClose={() => setModalMode(null)} />}
    </div>
  )
}
