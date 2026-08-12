import { lazy, Suspense } from 'react'
import { useInvestigationStore } from '../../../store/investigationStore'
import SectionShell from './SectionShell'

const FiberScene = lazy(() => import('./Scene3DCanvas'))

export default function Scene3DSection() {
  const activeScenario = useInvestigationStore((state) => state.scenarios.find((scenario) => scenario.id === state.activeScenarioId))

  return (
    <SectionShell
      title="3D DIGITAL TWIN"
      subtitle="Lightweight 3D scene using React Three Fiber"
      action={
        <div className="rounded-full border border-forensic-border px-3 py-1.5 font-[family-name:var(--font-mono)] text-[10px] tracking-[0.25em] text-forensic-muted uppercase">
          Lazy loaded
        </div>
      }
    >
      <div className="rounded border border-forensic-border bg-forensic-panel/70 p-3">
        <Suspense fallback={<div className="flex h-[320px] items-center justify-center text-sm text-slate-400">Loading 3D scene…</div>}>
          <FiberScene activeScenario={activeScenario} />
        </Suspense>
      </div>
    </SectionShell>
  )
}
