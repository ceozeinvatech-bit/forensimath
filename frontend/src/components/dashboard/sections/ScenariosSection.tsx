import { useMemo } from 'react'
import { useInvestigationStore } from '../../../store/investigationStore'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import { Eye, Play, BookOpen, Sparkles } from 'lucide-react'
import SectionShell from './SectionShell'

function formatScenarioStatus(raw?: string) {
  if (!raw) return 'Not analyzed'
  const s = raw.toLowerCase()
  if (s.includes('possible')) return 'Possible'
  if (s.includes('partial')) return 'Possible (partial)'
  if (s.includes('cannot determine') || s.includes('cannot determine')) return 'Cannot determine'
  if (s.includes('not possible') || s.includes('conflict')) return 'Not possible based on current evidence'
  return raw
}

function shortInterpretation(raw?: string) {
  if (!raw) return 'This scenario has not been analyzed yet.'
  const s = raw.toLowerCase()
  if (s.includes('possible')) return 'The available evidence is consistent with this proposed movement path.'
  if (s.includes('partial')) return 'Some evidence supports this path, but other items are unresolved or conflicting.'
  if (s.includes('cannot determine')) return 'There is not enough direction, timing, or path information to decide whether this scenario is possible.'
  if (s.includes('not possible') || s.includes('conflict')) return 'The proposed movement direction conflicts with the available evidence.'
  return raw
}

function statusLabel(raw?: string) {
  if (!raw) return 'Not analyzed'
  const s = raw.toLowerCase()
  if (s.includes('possible') && !s.includes('partial')) return 'Possible'
  if (s.includes('partial')) return 'Possible (partial)'
  if (s.includes('cannot determine')) return 'Cannot determine'
  if (s.includes('not possible') || s.includes('conflict')) return 'Not possible'
  return raw
}

function totalEvidenceCount(scenario: any) {
  const counts = scenario?.analysisCounts || {}
  return (counts.supporting || 0) + (counts.conflicting || 0) + (counts.unresolved || 0)
}

export default function ScenariosSection() {
  const scenarios = useInvestigationStore((s) => s.scenarios)
  const activeScenarioId = useInvestigationStore((s) => s.activeScenarioId)
  const setActiveScenario = useInvestigationStore((s) => s.setActiveScenario)
  const addScenario = useInvestigationStore((s) => s.addScenario)
  const explainScenario = useInvestigationStore((s) => s.explainScenario)
  const generateInsights = useInvestigationStore((s) => s.generateScenarioInsights)
  const evaluateScenario = useInvestigationStore((s) => s.evaluateScenario)
  const evaluateAll = useInvestigationStore((s) => s.evaluateAllScenarios)
  const evidenceList = useInvestigationStore((s) => s.evidence)

  const formatEvidenceLabel = (evidenceId: string) => {
    if (!evidenceId) return evidenceId || 'Unknown'
    const found = evidenceList.find((e) => e.id === evidenceId || e.label === evidenceId)
    if (found) return found.label
    // shorten long DB ids for display
    if (evidenceId.length > 12) return `${evidenceId.slice(0, 8)}...`
    return evidenceId
  }

  // ensure scenario list is unique and stable
  const uniqueScenarios = useMemo(() => {
    const map = new Map<string, any>()
    scenarios.forEach((s) => { if (s && s.id) map.set(s.id, s) })
    return Array.from(map.values())
  }, [scenarios])

  const chartData = useMemo(
    () => uniqueScenarios
      .filter((sc) => sc.analysisStatus && !String(sc.analysisStatus).toLowerCase().includes('not analyzed'))
      .map((sc) => ({
        name: sc.name,
        supporting: sc.analysisCounts?.supporting || 0,
        conflicting: sc.analysisCounts?.conflicting || 0,
        unresolved: sc.analysisCounts?.unresolved || 0,
      })),
    [uniqueScenarios],
  )

  const activeScenario = uniqueScenarios.find((sc) => sc.id === activeScenarioId) || null

  return (
    <SectionShell title="SCENARIOS" subtitle="Compare hypothetical reconstructions" action={
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => addScenario({ name: 'Scenario D', description: 'New possible movement path', movementType: 'User created', pathPoints: [] })}
          className="cursor-pointer border border-forensic-amber/50 bg-forensic-amber/10 px-3 py-2 text-xs font-semibold text-forensic-amber uppercase"
        >
          + Create Scenario
        </button>
        <button
          type="button"
          onClick={() => evaluateAll()}
          className="cursor-pointer border border-forensic-border px-3 py-2 text-xs font-semibold"
        >
          Evaluate All
        </button>
      </div>
    }>
      <div className="space-y-4">
        <div className="rounded-2xl border border-forensic-border bg-forensic-surface/40 p-4 text-sm leading-7 text-forensic-text/70">
          This section compares each scenario against the available evidence using deterministic, rule-based reconstruction analysis. It does not use generative reasoning for core assessment.
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-4">
            {uniqueScenarios.map((scenario) => (
              <div key={scenario.id} onClick={() => setActiveScenario(scenario.id)} className={`w-full rounded-2xl border p-4 text-left cursor-pointer ${activeScenarioId === scenario.id ? 'border-forensic-amber bg-forensic-amber/10' : 'border-forensic-border bg-forensic-panel/70'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-forensic-amber">{scenario.name}</p>
                    <p className="mt-2 text-lg font-semibold text-forensic-text">{scenario.description}</p>
                    <p className="mt-1 text-sm leading-6 text-forensic-text/70">Movement type: {scenario.movementType}</p>
                    <div className="mt-2">
                      <span className="inline-block rounded-full px-2 py-1 text-xs font-semibold bg-forensic-surface/60 border-forensic-border text-forensic-muted">{statusLabel(scenario.analysisStatus)}</span>
                    </div>
                  </div>
                  <div className="rounded-full border border-forensic-border px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-forensic-muted">{scenario.analysisStatus || 'Not analyzed'}</div>
                </div>

                  <div className="mt-3 flex items-center gap-2">
                  <button onClick={(e) => { e.stopPropagation(); setActiveScenario(scenario.id) }} className="flex items-center gap-2 rounded px-3 py-1 text-xs font-semibold border"><Eye className="h-3.5 w-3.5" />Inspect</button>
                  <button onClick={async (e) => { e.stopPropagation(); try { await evaluateScenario(scenario.id) } catch (err: any) { console.error(err); alert(err?.message || String(err) || 'Evaluate failed') } }} className="flex items-center gap-2 rounded px-3 py-1 text-xs font-semibold border"><Play className="h-3.5 w-3.5" />Evaluate</button>
                  {/* show Explain only after any analysis has been run */}
                  {scenario.analysisStatus && !scenario.analysisStatus.toLowerCase().includes('not analyzed') ? (
                    <>
                      <button onClick={async (e) => { e.stopPropagation(); try { await explainScenario(scenario.id) } catch (err: any) { console.error(err); alert(err?.message || String(err) || 'Explain failed') } }} className="flex items-center gap-2 rounded px-3 py-1 text-xs font-semibold border"><BookOpen className="h-3.5 w-3.5" />Explain</button>
                      {/* Generate insights only for analyzed scenarios that are not 'Undetermined' */}
                      {scenario.analysisStatus && !scenario.analysisStatus.toLowerCase().includes('insufficient') && !scenario.analysisStatus.toLowerCase().includes('cannot determine') ? (
                        <button onClick={async (e) => { e.stopPropagation(); try { await generateInsights(scenario.id); alert('Insights generated') } catch (err: any) { console.error(err); alert(err?.message || String(err) || 'Insights failed') } }} className="flex items-center gap-2 rounded px-3 py-1 text-xs font-semibold bg-forensic-amber text-white"><Sparkles className="h-3.5 w-3.5" />Generate Insights</button>
                      ) : null}
                      <button onClick={async (e) => { e.stopPropagation(); try { await (useInvestigationStore.getState().resetScenario)(scenario.id); alert('Analysis reset') } catch (err: any) { console.error(err); alert(err?.message || String(err) || 'Reset failed') } }} className="flex items-center gap-2 rounded px-3 py-1 text-xs font-semibold border bg-white/5">Reset</button>
                    </>
                  ) : null}
                </div>

                {scenario.explanation ? <div className="mt-3 text-sm text-forensic-text/70">{scenario.explanation}</div> : null}
              </div>
            ))}

            {activeScenario ? (
              <div className="rounded-2xl border border-forensic-border bg-forensic-surface/40 p-4">
                <h3 className="text-lg font-semibold">{activeScenario.name}</h3>
                <p className="text-sm text-forensic-text/70 mt-2">{activeScenario.description}</p>

                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase text-forensic-muted">Status</p>
                    <div className="mt-2 text-3xl font-bold">{formatScenarioStatus(activeScenario.analysisStatus)}</div>
                    <p className="mt-2 text-sm text-forensic-text/70">{shortInterpretation(activeScenario.analysisStatus)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase text-forensic-muted">Evidence checked</p>
                    <div className="mt-2 space-y-2 text-sm">
                      <div className="flex items-center justify-between"><div>Checked</div><div className="font-semibold">{totalEvidenceCount(activeScenario)} items</div></div>
                      <div className="flex items-center justify-between"><div>Supports this scenario</div><div className="font-semibold">{activeScenario.analysisCounts?.supporting ?? 0} items</div></div>
                      <div className="flex items-center justify-between"><div>Conflicts with this scenario</div><div className="font-semibold">{activeScenario.analysisCounts?.conflicting ?? 0} items</div></div>
                      <div className="flex items-center justify-between"><div>Not enough information</div><div className="font-semibold">{activeScenario.analysisCounts?.unresolved ?? 0} items</div></div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  <div className="rounded-2xl border border-forensic-border/70 bg-forensic-panel/70 p-3 text-sm text-forensic-text/70">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-forensic-muted">Conflicts</p>
                    {activeScenario.analysisConflicts?.length ? (
                      <ul className="mt-3 space-y-2">
                        {activeScenario.analysisConflicts.slice(0, 3).map((conflict: any, index: number) => (
                          <li key={`${conflict.evidenceId}-${index}`} className="rounded-xl bg-forensic-surface/80 p-3">
                            <div className="font-semibold">{conflict.type}</div>
                            <div className="text-xs text-forensic-text/70">{formatEvidenceLabel(conflict.evidenceId)}: {conflict.difference}</div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-3 text-sm text-forensic-text/70">No direct conflicts detected.</p>
                    )}
                  </div>
                  <div className="rounded-2xl border border-forensic-border/70 bg-forensic-panel/70 p-3 text-sm text-forensic-text/70">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-forensic-muted">Missing information</p>
                    <div className="mt-3 space-y-2">
                      {activeScenario.analysisGaps?.length ? activeScenario.analysisGaps.slice(0, 3).map((gap: string, index: number) => (
                        <div key={`gap-${index}`} className="rounded-xl bg-forensic-surface/80 p-3">{gap}</div>
                      )) : <p className="text-sm text-forensic-text/70">No gap observations recorded.</p>}
                      {activeScenario.analysisRecommendations?.length ? (
                        <div className="rounded-xl bg-forensic-surface/80 p-3">
                          <div className="font-semibold">Recommendation</div>
                          <div className="text-sm text-forensic-text/70">{activeScenario.analysisRecommendations[0]}</div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <p className="text-xs font-semibold uppercase text-forensic-muted">What does this mean?</p>
                  <div className="mt-2 text-sm text-forensic-text/70">{activeScenario.insights?.plain_language_explanation || activeScenario.explanation || 'No explanation available.'}</div>
                </div>
              </div>
            ) : null}
          </div>

          <div className="rounded-2xl border border-forensic-border bg-forensic-panel/70 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-forensic-muted">Scenario comparison</p>
            {uniqueScenarios.length > 1 ? (
              <div className="mt-4 h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, Math.max(...chartData.map((item) => Math.max(item.supporting, item.conflicting, item.unresolved)), 1)]} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <YAxis dataKey="name" type="category" width={120} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="supporting" stackId="a" fill="#4fd1ff" />
                    <Bar dataKey="conflicting" stackId="a" fill="#f97316" />
                    <Bar dataKey="unresolved" stackId="a" fill="#a3e635" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="mt-4">
                <p className="text-sm text-forensic-text/70">Comparison chart is shown when multiple scenarios exist. Add or generate more scenarios to enable comparison.</p>
              </div>
            )}

            <div className="mt-3 rounded-2xl border border-forensic-border/70 bg-forensic-surface/40 p-3 text-sm leading-6 text-forensic-text/70">
              {uniqueScenarios.length > 0 ? (
                <div>
                  <div className="font-semibold">{uniqueScenarios.length} scenarios compared</div>
                  <div className="text-forensic-text/70 mt-1">Compare supporting, conflicting, and unresolved evidence counts across scenarios.</div>
                </div>
              ) : (
                'Select a case to view scenario comparison.'
              )}
            </div>
          </div>
        </div>
      </div>
    </SectionShell>
  )
}
