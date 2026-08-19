import { useMemo, useState, useRef } from 'react'
import { Maximize2, Minus, Plus, RotateCcw, Sparkles } from 'lucide-react'
import { useInvestigationStore } from '../../../store/investigationStore'
import EvidenceInspector from './EvidenceInspector'
import SectionShell from './SectionShell'

// default scene bounds (meters) — overridden by selected case dimensions when available
const defaultSceneBounds = { width: 12, depth: 8 }

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
  // zoom / pan state
  const [scale, setScale] = useState<number>(1)
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const svgRef = useRef<SVGSVGElement | null>(null)
  const isPanning = useRef(false)
  const lastMouse = useRef<{ x: number; y: number } | null>(null)
  const [hoverInfo, setHoverInfo] = useState<{ x: number; y: number; item: any } | null>(null)

  const selectedCase = useInvestigationStore((state) => state.cases.find((c) => c.id === state.selectedCaseId))
  const sceneBounds = { width: selectedCase?.dimensions?.width ?? defaultSceneBounds.width, depth: selectedCase?.dimensions?.depth ?? defaultSceneBounds.depth }

  const sceneFrame = useMemo(() => {
    const points = evidence.map((item) => item.position).concat(activeScenario?.pathPoints || [])
    if (!points.length) return { minX: 0, maxX: sceneBounds.width, minZ: 0, maxZ: sceneBounds.depth }
    const xs = points.map((point) => point.x)
    const zs = points.map((point) => point.z)
    const xSpan = Math.max(Math.max(...xs) - Math.min(...xs), 1)
    const zSpan = Math.max(Math.max(...zs) - Math.min(...zs), 1)
    const xPadding = Math.max(xSpan * 0.14, 0.5)
    const zPadding = Math.max(zSpan * 0.14, 0.5)
    return { minX: Math.min(...xs) - xPadding, maxX: Math.max(...xs) + xPadding, minZ: Math.min(...zs) - zPadding, maxZ: Math.max(...zs) + zPadding }
  }, [activeScenario?.pathPoints, evidence, sceneBounds.depth, sceneBounds.width])

  const worldToScreen = (x: number, z: number) => {
    const padding = 48
    const width = 560
    const height = 320
    const scaleX = (width - padding * 2) / Math.max(sceneFrame.maxX - sceneFrame.minX, 1)
    const scaleZ = (height - padding * 2) / Math.max(sceneFrame.maxZ - sceneFrame.minZ, 1)
    const fitScale = Math.min(scaleX, scaleZ)
    const fittedWidth = (sceneFrame.maxX - sceneFrame.minX) * fitScale
    const fittedHeight = (sceneFrame.maxZ - sceneFrame.minZ) * fitScale
    const offsetX = (width - fittedWidth) / 2
    const offsetY = (height - fittedHeight) / 2
    return { x: offsetX + (x - sceneFrame.minX) * fitScale, y: height - offsetY - (z - sceneFrame.minZ) * fitScale }
  }

  const scenePoints = useMemo(() => {
    return evidence.map((item, index) => {
      const screen = worldToScreen(item.position.x, item.position.z)
      const nearby = evidence.slice(0, index).filter((other) => Math.hypot(other.position.x - item.position.x, other.position.z - item.position.z) < 0.25).length
      const angle = nearby * (Math.PI / 3)
      return { ...item, x: screen.x + Math.cos(angle) * nearby * 14, z: screen.y + Math.sin(angle) * nearby * 14, actualX: screen.x, actualY: screen.y }
    })
  }, [evidence, sceneFrame])

  const toScreen = (x: number, y: number) => ({ x: pan.x + x * scale, y: pan.y + y * scale })
  const zoomBy = (factor: number) => setScale((s) => Math.min(6, Math.max(0.25, +(s * factor).toFixed(3))))
  const resetView = () => { setScale(1); setPan({ x: 0, y: 0 }); }

  const onBackgroundMouseDown = (e: React.MouseEvent) => {
    // start panning only when background clicked
    if ((e.target as Element).id !== 'scene-background') return
    isPanning.current = true
    lastMouse.current = { x: e.clientX, y: e.clientY }
  }
  const onMouseMove = (e: React.MouseEvent) => {
    if (!isPanning.current || !lastMouse.current) return
    const dx = e.clientX - lastMouse.current.x
    const dy = e.clientY - lastMouse.current.y
    lastMouse.current = { x: e.clientX, y: e.clientY }
    setPan((p) => ({ x: p.x + dx, y: p.y + dy }))
  }
  const onMouseUp = () => { isPanning.current = false; lastMouse.current = null }

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY < 0 ? 1.12 : 0.9
    zoomBy(delta)
  }

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
      case 'Footwear Impression':
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
              <p className="mt-1 text-sm text-slate-400">Coordinate unit: metres | Scene bounds: {sceneBounds.width}m × {sceneBounds.depth}m</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" aria-label="Zoom in" onClick={() => zoomBy(1.2)} className="cursor-pointer rounded-xl border border-forensic-border/80 bg-white/8 px-3 py-2 text-forensic-text"><Plus className="h-4 w-4" /></button>
              <button type="button" aria-label="Zoom out" onClick={() => zoomBy(0.83)} className="cursor-pointer rounded-xl border border-forensic-border/80 bg-white/8 px-3 py-2 text-forensic-text"><Minus className="h-4 w-4" /></button>
              <button type="button" aria-label="Fit scene" onClick={() => resetView()} className="cursor-pointer rounded-xl border border-forensic-border/80 bg-white/8 px-3 py-2 text-forensic-text"><Maximize2 className="h-4 w-4" /></button>
              <button type="button" aria-label="Reset view" onClick={() => resetView()} className="cursor-pointer rounded-xl border border-forensic-border/80 bg-white/8 px-3 py-2 text-forensic-text"><RotateCcw className="h-4 w-4" /></button>
            </div>
          </div>

          <div className="rounded border border-forensic-border bg-forensic-surface/40 p-3">
            <div style={{ position: 'relative' }}>
            <svg ref={svgRef} onWheel={onWheel} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp} onMouseDown={onBackgroundMouseDown} viewBox="0 0 560 320" className="h-[340px] w-full">
              <rect id="scene-background" x="0" y="0" width="560" height="320" fill="#0f172a" rx="12" />
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

              <g transform={`translate(${pan.x},${pan.y}) scale(${scale})`}>
                {activeScenario?.pathPoints && activeScenario.pathPoints.length > 0 && (
                  <polyline
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="3"
                    points={activeScenario.pathPoints.map((point) => { const screen = worldToScreen(point.x, point.z); return `${screen.x},${screen.y}` }).join(' ')}
                  />
                )}

              {showMeasurements && (
                <line x1="80" y1="240" x2="500" y2="60" stroke="rgba(245,158,11,0.24)" strokeWidth="1.2" strokeDasharray="4 4" />
              )}

                {scenePoints.map((point) => (
                  <g key={point.id} onClick={() => setSceneState({ selectedEvidenceId: point.id })} onMouseEnter={() => { const s = toScreen(point.x, point.z); setHoverInfo({ x: s.x, y: s.y, item: point }) }} onMouseLeave={() => setHoverInfo(null)}>
                    {point.actualX !== point.x || point.actualY !== point.z ? <line x1={point.actualX} y1={point.actualY} x2={point.x} y2={point.z} stroke="#f59e0b" strokeDasharray="3 3" strokeWidth="1" /> : null}
                    {drawMarker(point)}
                    {showLabels && (
                      <text x={point.x + 12} y={point.z - 14} fill="#f8fafc" fontSize="11" style={{ pointerEvents: 'none' }}>
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
                  // compute midpoint and perpendicular offset for label
                  const midX = (from.x + to.x) / 2
                  const midY = (from.z + to.z) / 2
                  const dx = to.x - from.x
                  const dy = to.z - from.z
                  const labelOffset = 12
                  const len = Math.hypot(dx, dy) || 1
                  const ux = -dy / len
                  const uy = dx / len
                  const lx = midX + ux * labelOffset
                  const ly = midY + uy * labelOffset
                  const distanceValue = Math.hypot((to.position.x - from.position.x), (to.position.z - from.position.z))
                  return (
                    <g key={`line-${idx}`}> 
                      <line x1={from.x} y1={from.z} x2={to.x} y2={to.z} stroke="#f59e0b" strokeWidth={1.8} />
                      {showMeasurements && (
                        <g>
                          <text x={lx} y={ly} fill="#f8fafc" fontSize="11" style={{ pointerEvents: 'none' }}>{`${Math.round(distanceValue)} units`}</text>
                        </g>
                      )}
                    </g>
                  )
                })}
              {/* draw explicit user-selected connection */}
                {connectFrom && connectTo && (() => {
                  const from = scenePoints.find((p) => p.label === connectFrom)
                  const to = scenePoints.find((p) => p.label === connectTo)
                  if (!from || !to) return null
                  const midX = (from.x + to.x) / 2
                  const midY = (from.z + to.z) / 2
                  const dx = to.x - from.x
                  const dy = to.z - from.z
                  const len = Math.hypot(dx, dy) || 1
                  const ux = -dy / len
                  const uy = dx / len
                  const lx = midX + ux * 12
                  const ly = midY + uy * 12
                  const distanceValue = Math.hypot((to.position.x - from.position.x), (to.position.z - from.position.z))
                  return (
                    <g key={`user-line-${connectFrom}-${connectTo}`}>
                      <line x1={from.x} y1={from.z} x2={to.x} y2={to.z} stroke="#ef4444" strokeWidth={2.4} strokeDasharray="6 4" />
                      <text x={lx} y={ly} fill="#ffdddd" fontSize="11">{`${Math.round(distanceValue)} units`}</text>
                    </g>
                  )
                })()}
              </g>
            </svg>
            {hoverInfo && (
              <div style={{ position: 'absolute', left: hoverInfo.x + 12, top: hoverInfo.y - 48, background: 'rgba(2,6,23,0.9)', color: '#f8fafc', padding: '8px', borderRadius: 8, fontSize: 12, pointerEvents: 'none' }}>
                <div style={{ fontWeight: 700 }}>{hoverInfo.item.label}</div>
                <div style={{ fontSize: 12, opacity: 0.9 }}>{hoverInfo.item.type}</div>
                <div style={{ fontSize: 11, opacity: 0.8 }}>X: {hoverInfo.item.position.x.toFixed(1)}</div>
                <div style={{ fontSize: 11, opacity: 0.8 }}>Z: {hoverInfo.item.position.z.toFixed(1)}</div>
                {hoverInfo.item.measurements?.length && <div style={{ fontSize: 11, opacity: 0.8 }}>Length: {hoverInfo.item.measurements.length}</div>}
                {hoverInfo.item.measurements?.width && <div style={{ fontSize: 11, opacity: 0.8 }}>Width: {hoverInfo.item.measurements.width}</div>}
                {hoverInfo.item.measurements?.direction && <div style={{ fontSize: 11, opacity: 0.8 }}>Direction: {hoverInfo.item.measurements.direction}</div>}
              </div>
            )}
            </div>
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
                  {point.label} | {point.type}
                </button>
              ))}
            </div>
          </div>

          <EvidenceInspector selectedEvidenceId={selectedEvidenceId} />
          <div className="rounded border border-forensic-border bg-forensic-panel/70 p-4">
            <p className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.25em] text-forensic-muted uppercase">Scene Legend</p>
            <div className="mt-3 grid gap-2 text-xs text-forensic-text/70 sm:grid-cols-2">
              <span><span className="text-forensic-amber">○</span> Position</span><span><span className="text-forensic-amber">▭</span> Footprint / Object</span><span><span className="text-teal-300">◌</span> Simulated stain</span><span><span className="text-sky-300">↗</span> Trajectory with direction</span><span className="sm:col-span-2"><span className="text-forensic-amber">- -</span> Measurement / distance</span>
            </div>
            {selectedEvidenceId && <button type="button" onClick={() => setSceneState({ selectedEvidenceId: null })} className="mt-3 border border-forensic-border px-3 py-1.5 text-xs">Clear selection</button>}
          </div>
        </div>
      </div>
    </SectionShell>
  )
}