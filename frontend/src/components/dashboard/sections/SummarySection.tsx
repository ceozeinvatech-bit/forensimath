import { FileText } from 'lucide-react'
import { useInvestigationStore } from '../../../store/investigationStore'
import SectionShell from './SectionShell'

export default function SummarySection() {
  const activeCase = useInvestigationStore((state) => state.activeCase)
  const evidence = useInvestigationStore((state) => state.evidence)
  const scenarios = useInvestigationStore((state) => state.scenarios)
  const calculations = useInvestigationStore((state) => state.calculations)
  const generateSummary = useInvestigationStore((state) => state.generateSummary)
  const summaryGenerated = useInvestigationStore((state) => state.summaryGenerated)
  const summaryText = useInvestigationStore((state) => (state as any).summaryText)

  return (
    <SectionShell
      title="SUMMARY"
      subtitle="Educational report and reconstruction summary"
      action={
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => generateSummary()}
            className="flex items-center gap-2 rounded-full border border-forensic-amber/50 bg-forensic-amber/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-forensic-amber transition-colors hover:border-forensic-amber hover:bg-forensic-amber/20"
          >
            <FileText className="h-3.5 w-3.5" />
            {summaryGenerated ? 'Summary Ready' : 'Generate Summary'}
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="cursor-pointer rounded-xl border border-forensic-border/80 bg-white/8 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-forensic-text backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:border-forensic-accent/60 hover:bg-forensic-surface/80"
          >
            Print / Export
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="rounded-2xl border border-forensic-border/80 bg-gradient-to-br from-forensic-panel/80 to-forensic-surface/70 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-forensic-amber">Case Summary</p>
          <p className="mt-2 text-lg font-semibold text-forensic-text">{activeCase}</p>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">A transparent educational simulation of evidence interpretation, measurement transformation, and scenario comparison.</p>
          {summaryText && (
            <div className="mt-3 rounded border border-forensic-border bg-forensic-surface/40 p-3 text-sm text-forensic-text/70">
              <pre className="whitespace-pre-wrap">{summaryText}</pre>
            </div>
          )}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-forensic-border/70 bg-white/5 p-4 backdrop-blur-md">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-forensic-muted">Evidence Overview</p>
            <table className="mt-3 w-full text-sm text-slate-400">
              <thead>
                <tr className="text-left text-forensic-muted">
                  <th className="px-2 py-2">Label</th>
                  <th className="px-2 py-2">Type</th>
                  <th className="px-2 py-2">Position (X, Z)</th>
                  <th className="px-2 py-2">Key Measurement</th>
                </tr>
              </thead>
              <tbody>
                {evidence.map((item) => (
                  <tr key={item.id} className="border-b border-forensic-border/50 last:border-0">
                    <td className="px-2 py-2 font-medium text-forensic-text">{item.label}</td>
                    <td className="px-2 py-2">{item.type}</td>
                    <td className="px-2 py-2">({item.position.x.toFixed(1)}, {item.position.z.toFixed(1)}) m</td>
                    <td className="px-2 py-2">{item.measurements.length ? `${item.measurements.length} × ${item.measurements.width ?? '—'}` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="rounded-2xl border border-forensic-border/70 bg-white/5 p-4 backdrop-blur-md">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-forensic-muted">Mathematical Findings</p>
            <div className="mt-3 text-sm text-slate-400">
              <p className="mb-3">Distances calculated between evidence positions (rounded to two decimals):</p>
              <table className="w-full text-sm">
                <tbody>
                  {calculations
                    .filter((c) => (c.category ?? '') === 'distance' || (c.title ?? '').toLowerCase().includes('to'))
                    .map((c) => {
                      // attempt to extract labels
                      const labels = [] as string[]
                      evidence.forEach((e) => { if ((c.inputs ?? '').includes(e.label)) labels.push(e.label) })
                      const label = labels.length >= 2 ? `${labels[0]} → ${labels[1]}` : c.title
                      return (
                        <tr key={c.id} className="border-b border-forensic-border/50">
                          <td className="px-2 py-2">{label}</td>
                          <td className="px-2 py-2">{c.result}</td>
                        </tr>
                      )
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-forensic-border/70 bg-white/5 p-4 backdrop-blur-md">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-forensic-muted">Scenario Comparison</p>
          <ul className="mt-3 space-y-2 text-sm text-slate-400">
            {scenarios.map((scenario) => (
              <li key={scenario.id} className="border-b border-forensic-border/50 pb-2 last:border-0 last:pb-0">
                {scenario.name}: {scenario.analysisStatus || 'Not analyzed'} — {scenario.description}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-dashed border-forensic-border/80 bg-forensic-panel/70 p-4 text-sm text-slate-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
          Educational simulation only. Results represent mathematical and visual consistency within simulated evidence and are not criminal identification, legal conclusions, or probability of guilt.
        </div>
      </div>
    </SectionShell>
  )
}
