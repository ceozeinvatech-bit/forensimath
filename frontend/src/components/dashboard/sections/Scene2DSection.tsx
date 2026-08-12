import { useMemo, useState } from 'react'
import { Sparkles } from 'lucide-react'
import { useInvestigationStore } from '../../../store/investigationStore'
import EvidenceInspector from './EvidenceInspector'
import SectionShell from './SectionShell'

const sceneBounds = { width: 12, depth: 8 }

export default function Scene2DSection() {
  const evidence = useInvestigationStore((state) => state.evidence)
  const selectedEvidenceId = useInvestigationStore((state) => state.sceneState.selectedEvidenceId)
  const setSceneState = useInvestigationStore((state) => state.setSceneState)
  const activeScenario = useInvestigationStore((state) => state.scenarios.find((scenario) => scenario.id === state.activeScenarioId))
  const generateReconstruction = useInvestigationStore((state) => state.generateReconstruction)
  const reconstructionGenerated = useInvestigationStore((state) => state.reconstructionGenerated)
  const [showGrid, setShowGrid] = useState(true)
  const [showLabels, setShowLabels] = useState(true)
  const [showMeasurements, setShowMeasurements] = useState(true)
  const [connectFrom, setConnectFrom] = useState<string | null>(null)
  const [connectTo, setConnectTo] = useState<string | null>(null)

  const scenePoints = useMemo(() => {
    return evidence.map((item) => {
      const x = 80 + ((item.position.x / sceneBounds.width) * 420)
      const z = 240 - ((item.position.z / sceneBounds.depth) * 180)
      return { ...item, x, z }
    })
  }, [evidence])

  // Build pairwise distance lines from calculations so only real relationships are drawn
  const calculationLines = useMemo(() => {
    // find distance calculations from store
    const calcList = useInvestigationStore.getState().calculations || []
    const lines: Array<{ fromLabel: string; toLabel: string; distance: string }> = []
    calcList.forEach((c: any) => {
      if ((c.category ?? '') === 'distance' || (c.title ?? '').toLowerCase().includes('to')) {
        // attempt to parse referenced labels from inputs
        const labels = [] as string[]
        evidence.forEach((e) => {
          if ((c.inputs ?? '').includes(e.label)) labels.push(e.label)
        })
        if (labels.length >= 2) {
          lines.push({ fromLabel: labels[0], toLabel: labels[1], distance: c.result })
        }
      }
    })
    return lines
  }, [evidence])

  const drawMarker = (item: (typeof scenePoints)[number]) => {
    const isSelected = item.id === selectedEvidenceId
    const baseX = item.x
    const baseY = item.z

    switch (item.type) {
      case 'Footprint':
        return (
          <g key={item.id}>
            <ellipse cx={baseX} cy={baseY} rx="20" ry="12" fill="rgba(245,158,11,0.18)" stroke="#f59e0b" strokeWidth={isSelected ? 3 : 1.5} transform={`rotate(-24 ${baseX} ${baseY})`} />
            <circle cx={baseX} cy={baseY} r={isSelected ? 6 : 4} fill="#f59e0b" />
          </g>
        )
      case 'Simulated Stain':
        return (
          <g key={item.id}>
            <ellipse cx={baseX} cy={baseY} rx="24" ry="14" fill="rgba(45,212,191,0.18)" stroke="#2dd4bf" strokeWidth={isSelected ? 3 : 1.5} />
            <circle cx={baseX} cy={baseY} r={isSelected ? 5 : 3.5} fill="#2dd4bf" />
          </g>
        )
      case 'Position':
        return (
          <g key={item.id}>
            <circle cx={baseX} cy={baseY} r={isSelected ? 8 : 5} fill="#e2e8f0" stroke="#f59e0b" strokeWidth={isSelected ? 2 : 1} />
          </g>
        )
      case 'Trajectory':
        return (
          <g key={item.id}>
            <line x1={baseX - 18} y1={baseY + 10} x2={baseX + 24} y2={baseY - 20} stroke="#38bdf8" strokeWidth={isSelected ? 3 : 2} />
            <circle cx={baseX - 18} cy={baseY + 10} r="4" fill="#38bdf8" />
            <circle cx={baseX + 24} cy={baseY - 20} r="4" fill="#38bdf8" />
          </g>
        )
      case 'Measurement':
        return (
          <g key={item.id}>
            <line x1={baseX - 22} y1={baseY - 12} x2={baseX + 30} y2={baseY + 16} stroke="#fbbf24" strokeWidth={isSelected ? 3 : 2} />
            <circle cx={baseX - 22} cy={baseY - 12} r="4" fill="#fbbf24" />
            <circle cx={baseX + 30} cy={baseY + 16} r="4" fill="#fbbf24" />
          </g>
        )
      default:
        return (
          <g key={item.id}>
            <rect x={baseX - 10} y={baseY - 10} width="20" height="20" rx="3" fill="rgba(245,158,11,0.16)" stroke="#f59e0b" strokeWidth={isSelected ? 3 : 1.5} />
          </g>
        )
    }
  }

  return (
    <SectionShell
      title="2D SCENE"
      subtitle="Top-down simulated evidence scene"
      action={
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => generateReconstruction()} className="flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-300 transition-colors hover:border-emerald-400 hover:bg-emerald-500/20">
            <Sparkles className="h-3.5 w-3.5" />
            {reconstructionGenerated ? 'Reconstruction Ready' : 'Generate Reconstruction'}
          </button>
          <button type="button" onClick={() => setShowGrid((value) => !value)} className="cursor-pointer rounded-xl border border-forensic-border/80 bg-white/8 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-forensic-text backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:border-forensic-accent/60 hover:bg-forensic-surface/80">
            {showGrid ? 'Grid On' : 'Grid Off'}
          </button>
          <button type="button" onClick={() => setShowLabels((value) => !value)} className="cursor-pointer rounded-xl border border-forensic-border/80 bg-white/8 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-forensic-text backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:border-forensic-accent/60 hover:bg-forensic-surface/80">
            {showLabels ? 'Labels On' : 'Labels Off'}
          </button>
          <button type="button" onClick={() => setShowMeasurements((value) => !value)} className="cursor-pointer rounded-xl border border-forensic-border/80 bg-white/8 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-forensic-text backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:border-forensic-accent/60 hover:bg-forensic-surface/80">
            {showMeasurements ? 'Measure On' : 'Measure Off'}
          </button>
        </div>
      }
    >
      <div className="grid gap-4 xl:grid-cols-[1.4fr_0.7fr]">
        <div className="rounded border border-forensic-border bg-forensic-panel/70 p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.25em] text-forensic-amber uppercase">Simulated Scene — Top-down View</p>
              <p className="mt-1 text-sm text-slate-400">Coordinate unit: metres • Scene bounds: {sceneBounds.width}m × {sceneBounds.depth}m</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="cursor-pointer rounded-xl border border-forensic-border/80 bg-white/8 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-forensic-text backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:border-forensic-accent/60 hover:bg-forensic-surface/80">Zoom In</button>
              <button type="button" className="cursor-pointer rounded-xl border border-forensic-border/80 bg-white/8 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-forensic-text backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:border-forensic-accent/60 hover:bg-forensic-surface/80">Reset View</button>
            </div>
          </div>

          <div className="rounded border border-forensic-border bg-forensic-surface/40 p-3">
            <svg viewBox="0 0 560 320" className="h-[340px] w-full">
              <rect x="0" y="0" width="560" height="320" fill="#0f172a" rx="12" />
              {showGrid && (
                <g stroke="rgba(148,163,184,0.16)" strokeWidth="1">
                  {Array.from({ length: 13 }).map((_, index) => (
                    <line key={`grid-y-${index}`} x1="40" x2="520" y1={40 + index * 20} y2={40 + index * 20} />
                  ))}
                  {Array.from({ length: 13 }).map((_, index) => (
                    <line key={`grid-x-${index}`} x1={40 + index * 40} x2={40 + index * 40} y1="40" y2="280" />
                  ))}
                </g>
              )}

              {activeScenario?.pathPoints && activeScenario.pathPoints.length > 0 && (
                <polyline
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="3"
                  points={activeScenario.pathPoints.map((point) => `${80 + (point.x / sceneBounds.width) * 420},${240 - (point.z / sceneBounds.depth) * 180}`).join(' ')}
                />
              )}

              {showMeasurements && (
                <line x1="80" y1="240" x2="500" y2="60" stroke="rgba(245,158,11,0.24)" strokeWidth="1.2" strokeDasharray="4 4" />
              )}

              {scenePoints.map((point) => (
                <g key={point.id} onClick={() => setSceneState({ selectedEvidenceId: point.id })}>
                  {drawMarker(point)}
                  {showLabels && (
                    <text x={point.x + 12} y={point.z - 10} fill="#f8fafc" fontSize="11">
                      {point.label}
                    </text>
                  )}
                </g>
              ))}

              {/* draw distance lines */}
              {calculationLines.map((line, idx) => {
                const from = scenePoints.find((p) => p.label === line.fromLabel)
                const to = scenePoints.find((p) => p.label === line.toLabel)
                if (!from || !to) return null
                return (
                  <g key={`line-${idx}`}> 
                    <line x1={from.x} y1={from.z} x2={to.x} y2={to.z} stroke="#f59e0b" strokeWidth={1.8} />
                    {showMeasurements && (
                      <text x={(from.x + to.x) / 2 + 6} y={(from.z + to.z) / 2 - 6} fill="#f8fafc" fontSize="11">{line.distance}</text>
                    )}
                  </g>
                )
              })}
              {/* draw explicit user-selected connection */}
              {connectFrom && connectTo && (
                (() => {
                  const from = scenePoints.find((p) => p.label === connectFrom)
                  const to = scenePoints.find((p) => p.label === connectTo)
                  if (!from || !to) return null
                  return (
                    <g key={`user-line-${connectFrom}-${connectTo}`}>
                      <line x1={from.x} y1={from.z} x2={to.x} y2={to.z} stroke="#ef4444" strokeWidth={2.4} strokeDasharray="6 4" />
                      <text x={(from.x + to.x) / 2 + 6} y={(from.z + to.z) / 2 - 6} fill="#ffdddd" fontSize="11">{`${connectFrom} → ${connectTo}`}</text>
                    </g>
                  )
                })()
              )}
            </svg>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded border border-forensic-border bg-forensic-panel/70 p-4">
            <p className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.25em] text-forensic-muted uppercase">Evidence Tabs</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <select value={connectFrom ?? ''} onChange={(e) => setConnectFrom(e.target.value || null)} className="rounded border bg-forensic-surface/40 px-2 py-1 text-sm">
                  <option value="">Connect from</option>
                  {scenePoints.map((p) => (<option key={p.id} value={p.label}>{p.label}</option>))}
                </select>
                <select value={connectTo ?? ''} onChange={(e) => setConnectTo(e.target.value || null)} className="rounded border bg-forensic-surface/40 px-2 py-1 text-sm">
                  <option value="">Connect to</option>
                  {scenePoints.map((p) => (<option key={p.id} value={p.label}>{p.label}</option>))}
                </select>
                <button type="button" onClick={() => { setConnectFrom(null); setConnectTo(null); }} className="rounded border px-2 py-1 text-sm">Clear</button>
              </div>
              {scenePoints.map((point) => (
                <button
                  key={point.id}
                  type="button"
                  onClick={() => setSceneState({ selectedEvidenceId: point.id })}
                  className={`cursor-pointer border px-3 py-2 font-[family-name:var(--font-mono)] text-[10px] tracking-[0.2em] uppercase transition-colors ${
                    selectedEvidenceId === point.id
                      ? 'border-forensic-amber bg-forensic-amber/16 text-forensic-text'
                      : 'border-forensic-border text-forensic-text/85 hover:border-forensic-accent/60 hover:bg-forensic-surface/70 hover:text-forensic-text'
                  }`}
                >
                  {point.label} • {point.type}
                </button>
              ))}
            </div>
          </div>

          <EvidenceInspector selectedEvidenceId={selectedEvidenceId} />
        </div>
      </div>
    </SectionShell>
  )
}
