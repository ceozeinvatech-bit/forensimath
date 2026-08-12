import { useMemo, useState } from 'react'
import { useInvestigationStore } from '../../../store/investigationStore'
import SectionShell from './SectionShell'

export default function CaseInfoSection() {
  const activeCase = useInvestigationStore((state) => state.activeCase)
  const selectedCaseId = useInvestigationStore((state) => state.selectedCaseId)
  const cases = useInvestigationStore((state) => state.cases)
  const evidence = useInvestigationStore((state) => state.evidence)
  const scenarios = useInvestigationStore((state) => state.scenarios)
  const setActiveSection = useInvestigationStore((state) => state.setActiveSection)
  const [isCreating, setIsCreating] = useState(false)

  const selectedCase = useMemo(
    () => cases.find((candidate) => candidate.id === selectedCaseId),
    [cases, selectedCaseId],
  )

  return (
    <SectionShell
      title="CASE OVERVIEW"
      subtitle="Case information and investigative status"
      action={
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setIsCreating((value) => !value)}
            className="cursor-pointer rounded-xl border border-forensic-amber/60 bg-forensic-amber px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-forensic-bg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(247,184,74,0.25)]"
          >
            {isCreating ? 'Cancel' : 'Create New Case'}
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('Evidence')}
            className="cursor-pointer rounded-xl border border-forensic-border/80 bg-white/8 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-forensic-text backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:border-forensic-accent/60 hover:bg-forensic-surface/80"
          >
            Add Evidence
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        {isCreating && (
          <div className="rounded border border-forensic-border bg-forensic-surface/50 p-4">
            <p className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.25em] text-forensic-muted uppercase">
              New case draft
            </p>
            <p className="mt-2 text-sm text-slate-400">
              Create a new investigation case to begin. Cases are stored persistently in the backend database.
            </p>
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded border border-forensic-border bg-forensic-surface/40 p-4">
            <p className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.25em] text-forensic-muted uppercase">
              Current Case
            </p>
            <p className="mt-2 text-xl font-semibold text-forensic-text">{activeCase}</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              {selectedCase?.description ?? 'No cases yet. Create your first investigation case to begin.'}
            </p>
          </div>

          <div className="rounded border border-forensic-border bg-forensic-surface/40 p-4">
            <p className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.25em] text-forensic-muted uppercase">
              Description
            </p>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              This workspace simulates a small evidence scene with measurable relationships, optional image analysis, and multiple scenario interpretations.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Location', value: selectedCase?.location ?? 'Indoor simulated environment' },
            { label: 'Created date', value: selectedCase?.createdAt ?? '2026-08-10' },
            { label: 'Evidence count', value: `${evidence.length}` },
            { label: 'Scenario count', value: `${scenarios.length}` },
          ].map((item) => (
            <div key={item.label} className="rounded border border-forensic-border bg-forensic-panel/70 p-4">
              <p className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.25em] text-forensic-muted uppercase">
                {item.label}
              </p>
              <p className="mt-2 text-sm font-medium text-forensic-text">{item.value}</p>
            </div>
          ))}
        </div>

        <div className="rounded border border-forensic-border bg-forensic-surface/40 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.25em] text-forensic-muted uppercase">
                Analysis status
              </p>
              <p className="mt-2 text-sm text-slate-400">Ready for evidence entry and mathematical reconstruction.</p>
            </div>
            <span className="rounded-full border border-forensic-amber/40 bg-forensic-amber/10 px-3 py-1 font-[family-name:var(--font-mono)] text-[10px] tracking-[0.2em] text-forensic-amber uppercase">
              Ready
            </span>
          </div>
        </div>
      </div>
    </SectionShell>
  )
}
