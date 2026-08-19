import { FileText, Printer } from 'lucide-react'
import { useMemo } from 'react'
import { useInvestigationStore } from '../../../store/investigationStore'
import SectionShell from './SectionShell'

const value = (raw?: string) => { const match = raw?.match(/-?\d+(?:\.\d+)?/); return match ? Number(match[0]) : null }
const average = (values: number[]) => values.length ? values.reduce((sum, item) => sum + item, 0) / values.length : null

export default function SummarySection() {
  const activeCase = useInvestigationStore((state) => state.activeCase)
  const evidence = useInvestigationStore((state) => state.evidence)
  const scenarios = useInvestigationStore((state) => state.scenarios)
  const calculations = useInvestigationStore((state) => state.calculations)
  const generateSummary = useInvestigationStore((state) => state.generateSummary)
  const summaryGenerated = useInvestigationStore((state) => state.summaryGenerated)
  const summaryText = useInvestigationStore((state) => state.summaryText)
  const lengthAverage = useMemo(() => average(evidence.map((item) => value(item.measurements.length)).filter((item): item is number => item !== null)), [evidence])
  const gaps = evidence.filter((item) => !Object.values(item.measurements).some(Boolean)).map((item) => `${item.label} has no recorded measurement notes or dimensions.`)
  const strongest = scenarios.find((scenario) => scenario.analysisStatus && !scenario.analysisStatus.toLowerCase().includes('not analyzed'))
  const strongestCounts = strongest?.analysisCounts
  return <SectionShell title="SUMMARY" subtitle="Investigation report from recorded evidence" action={<div className="flex flex-wrap gap-2"><button type="button" onClick={() => void generateSummary()} className="flex items-center gap-2 border border-forensic-amber/50 bg-forensic-amber/10 px-3 py-2 text-xs font-semibold text-forensic-amber"><FileText className="h-3.5 w-3.5" />{summaryGenerated ? 'Summary Ready' : 'Generate Summary'}</button><button type="button" onClick={() => window.print()} aria-label="Print report" className="border border-forensic-border px-3 py-2"><Printer className="h-4 w-4" /></button></div>}>
    <article className="space-y-5 border border-forensic-border bg-forensic-panel/60 p-5 text-sm">
      <header className="border-b border-forensic-border pb-4"><p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-forensic-amber">FORENSIMATH INVESTIGATION REPORT</p><h2 className="mt-2 text-2xl font-semibold">{activeCase}</h2><p className="mt-2 text-forensic-text/70">Educational mathematical reconstruction of the recorded evidence.</p></header>
      <section><h3 className="font-semibold">1. Case overview</h3><p className="mt-2 text-forensic-text/70">This report describes what was measured and how the entered evidence compares with any explicitly created hypothetical movement path.</p></section>
      <section><h3 className="font-semibold">2. Evidence review</h3><p className="mt-2 text-forensic-text/70">Evidence examined: {evidence.length} items</p><div className="mt-2 grid gap-2 md:grid-cols-2">{evidence.map((item) => <div key={item.id} className="border border-forensic-border bg-forensic-surface/40 p-3"><strong>{item.label}</strong><span className="ml-2 text-forensic-text/60">{item.type}</span><p className="mt-1 text-xs text-forensic-text/60">Position: X {item.position.x.toFixed(2)} m, Z {item.position.z.toFixed(2)} m</p></div>)}</div></section>
      <section><h3 className="font-semibold">3. Measurements</h3><p className="mt-2 text-forensic-text/70">Length average: {lengthAverage === null ? 'No valid length measurements available.' : `${lengthAverage.toFixed(1)} mm across recorded values.`}</p><p className="mt-1 text-xs text-forensic-text/60">An average summarizes the recorded length values; it does not estimate missing measurements.</p></section>
      <section><h3 className="font-semibold">4. Spatial relationships</h3><div className="mt-2 space-y-1 text-forensic-text/70">{calculations.filter((calculation) => calculation.category === 'distance').slice(0, 8).map((calculation) => <p key={calculation.id}>{calculation.title}: {calculation.result}</p>)}{!calculations.some((calculation) => calculation.category === 'distance') && <p>No distance calculations have been run yet.</p>}</div></section>
      <section><h3 className="font-semibold">5. Hypothetical scenarios</h3>{strongest ? <div className="mt-2 border border-forensic-border bg-forensic-surface/40 p-3"><p><strong>{strongest.name}</strong> - {strongest.analysisStatus}</p><p className="mt-1 text-forensic-text/70">The assumed path agrees with {strongestCounts?.supporting ?? 0} evidence checks, conflicts with {strongestCounts?.conflicting ?? 0}, and has {strongestCounts?.unresolved ?? 0} unresolved checks.</p></div> : <p className="mt-2 text-forensic-text/70">No hypothetical scenario has been evaluated.</p>}</section>
      <section><h3 className="font-semibold">6. Evidence gaps</h3>{gaps.length ? <ul className="mt-2 list-disc space-y-1 pl-5 text-forensic-text/70">{gaps.map((gap) => <li key={gap}>{gap}</li>)}</ul> : <p className="mt-2 text-forensic-text/70">No obvious direction or timestamp gaps were recorded.</p>}</section>
      <section><h3 className="font-semibold">7. Plain-language conclusion</h3><p className="mt-2 text-forensic-text/70">{strongest ? 'The available measurements can support, conflict with, or leave parts of the selected assumed path unresolved. This comparison does not establish what actually happened.' : 'Run the mathematical analysis and create a hypothetical path to produce an evidence comparison.'}</p></section>
      {summaryText && <section><h3 className="font-semibold">Generated narrative</h3><p className="mt-2 whitespace-pre-wrap text-forensic-text/70">{summaryText}</p></section>}
      <footer className="border-t border-dashed border-forensic-border pt-4 text-xs text-forensic-text/60">Educational simulation only. This report does not identify a person, determine guilt, or provide a legal conclusion.</footer>
    </article>
  </SectionShell>
}
