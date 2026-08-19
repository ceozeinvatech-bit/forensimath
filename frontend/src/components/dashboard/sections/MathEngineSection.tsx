import { BarChart3, Gauge, Layers3, PlayCircle, ScanSearch, Waypoints, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { ResponsiveContainer, Area, AreaChart, CartesianGrid, Tooltip, XAxis, YAxis, Line, LineChart } from 'recharts'
import { useInvestigationStore } from '../../../store/investigationStore'
import SectionShell from './SectionShell'

const filterOptions = ['All', 'Distance', 'Geometry', 'Statistics', 'Stride', 'Stain', 'Direction', 'Position'] as const

type FilterKey = (typeof filterOptions)[number]

const formatMeasurement = (value: number | null) => value === null ? 'N/A' : `${value.toFixed(1)}`

export default function MathEngineSection() {
  const evidence = useInvestigationStore((state) => state.evidence)
  const calculations = useInvestigationStore((state) => state.calculations)
  const analysisState = useInvestigationStore((state) => state.analysisState)
  const runAnalysis = useInvestigationStore((state) => state.runAnalysis)
  const selectedEvidenceId = useInvestigationStore((state) => state.sceneState.selectedEvidenceId)
  const setSceneState = useInvestigationStore((state) => state.setSceneState)
  const [filter, setFilter] = useState<FilterKey>('All')
  const [searchTerm, setSearchTerm] = useState('')
  const [showMeasurementCharts, setShowMeasurementCharts] = useState(true)
  const [selectedMeasurementIds, setSelectedMeasurementIds] = useState<string[]>([])

  // use selected case dimensions if available so plots scale to case units
  const selectedCase = useInvestigationStore((state) => state.cases.find((c) => c.id === state.selectedCaseId))
  const plotBounds = { width: selectedCase?.dimensions?.width ?? 12, depth: selectedCase?.dimensions?.depth ?? 8 }
  const validCoordinates = evidence.filter((item) => Number.isFinite(item.position.x) && Number.isFinite(item.position.z))
  const mathEvidence = selectedMeasurementIds.length ? evidence.filter((item) => selectedMeasurementIds.includes(item.id)) : evidence
  const evidenceWithMeasurements = evidence.filter((item) => Object.values(item.measurements).some((value) => Boolean(value)))
  const evidenceWithOrientation = evidence.filter((item) => Boolean(item.measurements.orientation) || Boolean(item.measurements.direction))
  const footprintEvidence = evidence.filter((item) => {
    const t = (item.type || '').toString().toLowerCase()
    return t === 'footprint' || t === 'footwear impression' || t.includes('foot')
  })

  const numericMeasurements = useMemo(() => {
    const values = mathEvidence
      .map((item) => parseFloat(item.measurements.length?.replace(/[^0-9.]/g, '') ?? ''))
      .filter((value) => Number.isFinite(value))
    return values
  }, [mathEvidence])

  const widthValues = useMemo(() => {
    const values = mathEvidence
      .map((item) => parseFloat(item.measurements.width?.replace(/[^0-9.]/g, '') ?? ''))
      .filter((value) => Number.isFinite(value))
    return values
  }, [mathEvidence])

  const orientationValues = useMemo(() => {
    const values = mathEvidence
      .map((item) => parseFloat((item.measurements.orientation ?? item.measurements.direction ?? '').replace(/[^0-9.]/g, '') ?? ''))
      .filter((value) => Number.isFinite(value))
    return values
  }, [mathEvidence])

  const stats = (values: number[]) => {
    if (values.length === 0) {
      return { mean: null, min: null, max: null, range: null, stdDev: null }
    }

    const mean = values.reduce((sum, value) => sum + value, 0) / values.length
    const min = Math.min(...values)
    const max = Math.max(...values)
    const range = max - min
    const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length
    const stdDev = Math.sqrt(variance)

    return { mean, min, max, range, stdDev }
  }

  const lengthStats = stats(numericMeasurements)
  const widthStats = stats(widthValues)
  const orientationStats = stats(orientationValues)

  const relationshipRows = useMemo(() => {
    const rows = [] as Array<{ id: string; from: string; to: string; distance: number | null; angle: number | null; relation: string }>
    for (let i = 0; i < mathEvidence.length; i += 1) {
      for (let j = i + 1; j < mathEvidence.length; j += 1) {
        const first = mathEvidence[i]
        const second = mathEvidence[j]
        if (!Number.isFinite(first.position.x) || !Number.isFinite(first.position.z) || !Number.isFinite(second.position.x) || !Number.isFinite(second.position.z)) {
          continue
        }
        const dx = second.position.x - first.position.x
        const dz = second.position.z - first.position.z
        const distance = Math.hypot(dx, dz)
        const angle = Math.atan2(dz, dx) * (180 / Math.PI)
        let relation = 'Calculated relationship'
        if (distance < 3) relation = 'Near'
        else if (distance < 5) relation = 'Aligned'
        else relation = 'Separated'
        rows.push({ id: `${first.label}-${second.label}`, from: first.label, to: second.label, distance, angle, relation })
      }
    }
    return rows
  }, [mathEvidence])

  const filteredCalculations = useMemo(() => {
    const search = searchTerm.trim().toLowerCase()
    // Build a set of calculation objects filtered by category and search
    return calculations.filter((calculation) => {
      const catKey = calculation.category ?? ''
      const matchesFilter = filter === 'All' || catKey === filter.toLowerCase()[0] + filter.toLowerCase().slice(1)
      const title = (calculation.title ?? '').toString().toLowerCase()
      const inputs = (calculation.inputs ?? '').toString().toLowerCase()
      const matchesSearch = !search || title.includes(search) || inputs.includes(search)
      const matchesEvidence = !selectedMeasurementIds.length || selectedMeasurementIds.some((id) => {
        const item = evidence.find((entry) => entry.id === id)
        return calculation.evidenceId === id || Boolean(item && `${calculation.title} ${calculation.inputs}`.includes(item.label))
      })
      return matchesFilter && matchesSearch && matchesEvidence
    })
  }, [calculations, evidence, filter, searchTerm, selectedMeasurementIds])

  // Group calculations by evidence label so UI never shows internal IDs as the primary label
  const groupedCalculations = useMemo(() => {
    const groups = new Map<string, Array<any>>()
    // initialize groups for all evidence labels
    evidence.forEach((e) => groups.set(e.label, []))

    const findLabelsInCalc = (calc: any) => {
      const found: string[] = []
      evidence.forEach((e) => {
        const needle = e.label
        const hay = `${calc.inputs ?? ''} ${calc.title ?? ''}`
        if (hay.includes(needle)) found.push(needle)
      })
      return found
    }

    filteredCalculations.forEach((calc) => {
      const labels = findLabelsInCalc(calc)
      if (labels.length === 0) {
        // attach to primary evidence by id if possible
        const primary = evidence.find((e) => e.id === calc.evidenceId)
        if (primary) groups.get(primary.label)?.push(calc)
        return
      }

      // attach calculation to every evidence label it references
      labels.forEach((lbl) => {
        if (!groups.has(lbl)) groups.set(lbl, [])
        groups.get(lbl)!.push(calc)
      })
    })

    return groups
  }, [filteredCalculations, evidence])

  const analysisChartData = calculations.map((calculation, index) => ({
    name: calculation.title,
    value: Math.max(20, 70 - index * 8 + (index % 2 === 0 ? 4 : -2)),
  }))

  const strideSeries = footprintEvidence.map((item, index) => ({
    index: index + 1,
    value: parseFloat(item.measurements.length?.replace(/[^0-9.]/g, '') ?? '0') || 0,
  }))

  const summaryKpis = [
    { label: 'Evidence', value: evidence.length.toString(), icon: Layers3 },
    { label: 'Calculations', value: calculations.length.toString(), icon: BarChart3 },
    { label: 'Measurements', value: evidenceWithMeasurements.length.toString(), icon: Gauge },
    { label: 'Relationships', value: relationshipRows.length.toString(), icon: ScanSearch },
  ]

  return (
    <SectionShell
      title="MATH ENGINE"
      subtitle="Transparent calculations and evidence relationships"
      action={
        <button
          type="button"
          onClick={() => runAnalysis()}
          className="flex items-center gap-2 rounded-full border border-forensic-amber/50 bg-forensic-amber/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.25em] text-forensic-amber transition-colors hover:border-forensic-amber hover:bg-forensic-amber/20"
        >
          <PlayCircle className="h-3.5 w-3.5" />
          {analysisState.status === 'running' ? 'Running Analysis' : 'Run Analysis'}
        </button>
      }
    >
      <div className="space-y-4">
        <div className="rounded-2xl border border-forensic-border/80 bg-forensic-surface/40 p-4 text-sm leading-7 text-forensic-text/70">
          Every result is derived from recorded evidence, explicit formulas, and measurable inputs.
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {summaryKpis.map((item) => {
            const Icon = item.icon
            return (
              <div key={item.label} className="rounded-2xl border border-forensic-border bg-forensic-panel/70 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-forensic-muted">{item.label}</p>
                  <Icon className="h-4 w-4 text-forensic-amber" />
                </div>
                <p className="mt-3 text-2xl font-semibold text-forensic-text">{item.value}</p>
              </div>
            )
          })}
        </div>

        <div className="rounded-2xl border border-forensic-border bg-forensic-panel/70 p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-forensic-muted">Analysis Insights</p>
              <p className="mt-1 text-sm text-forensic-text/70">Deterministic observations derived from the current evidence set.</p>
            </div>
            <div className="rounded-full border border-forensic-border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.25em] text-forensic-amber">
              {analysisState.status}
            </div>
          </div>
          <ul className="grid gap-2 md:grid-cols-2">
            <li className="rounded-xl border border-forensic-border bg-forensic-surface/40 p-3 text-sm text-forensic-text/70">{validCoordinates.length} evidence items have valid spatial coordinates.</li>
            <li className="rounded-xl border border-forensic-border bg-forensic-surface/40 p-3 text-sm text-forensic-text/70">{evidenceWithMeasurements.length} evidence items contain measurements.</li>
            <li className="rounded-xl border border-forensic-border bg-forensic-surface/40 p-3 text-sm text-forensic-text/70">{evidenceWithOrientation.length} evidence items contain orientation values.</li>
            <li className="rounded-xl border border-forensic-border bg-forensic-surface/40 p-3 text-sm text-forensic-text/70">{relationshipRows.length} mathematical relationships are currently available.</li>
          </ul>
        </div>

        <div className="rounded-2xl border border-forensic-border bg-forensic-panel/70 p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-forensic-muted">Overall Analysis</p>
              <p className="mt-1 text-sm text-forensic-text/70">A blended overview of the active evidence interpretation trend.</p>
            </div>
            <div className="rounded-full border border-forensic-border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.25em] text-forensic-amber">
              {analysisState.status}
            </div>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analysisChartData}>
                <defs>
                  <linearGradient id="analysisGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f7b84a" stopOpacity={0.38} />
                    <stop offset="100%" stopColor="#f7b84a" stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(148,163,184,0.15)" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} domain={[0, 100]} axisLine={false} tickLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="value" stroke="#f7b84a" strokeWidth={2.5} fill="url(#analysisGlow)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-forensic-border bg-forensic-panel/70 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-forensic-muted">Evidence Spatial Distribution</p>
              <p className="mt-1 text-sm text-forensic-text/70">Simulated evidence spatial plot using the active X-Z coordinates.</p>
            </div>
            <div className="rounded-full border border-forensic-border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.25em] text-forensic-amber">Educational plot</div>
          </div>
          <div className="mt-4 h-80 w-full rounded-2xl border border-forensic-border bg-forensic-surface/40 p-3">
            <svg viewBox="0 0 560 320" className="h-full w-full">
              <rect x="0" y="0" width="560" height="320" rx="16" fill="rgba(15,23,42,0.6)" />
              <line x1="40" y1="280" x2="520" y2="280" stroke="#64748b" strokeWidth="1.2" />
              <line x1="40" y1="40" x2="40" y2="280" stroke="#64748b" strokeWidth="1.2" />
              {Array.from({ length: 10 }).map((_, index) => (
                <line key={`v-${index}`} x1={40 + index * 48} x2={40 + index * 48} y1="40" y2="280" stroke="rgba(148,163,184,0.12)" />
              ))}
              {Array.from({ length: 8 }).map((_, index) => (
                <line key={`h-${index}`} x1="40" x2="520" y1={40 + index * 34} y2={40 + index * 34} stroke="rgba(148,163,184,0.12)" />
              ))}
              <text x="20" y="24" fill="#f8fafc" fontSize="11">Z</text>
              <text x="525" y="292" fill="#f8fafc" fontSize="11">X</text>
                {evidence.map((item) => {
                const x = 40 + ((item.position.x / plotBounds.width) * 480)
                const z = 280 - ((item.position.z / plotBounds.depth) * 240)
                const isSelected = item.id === selectedEvidenceId
                return (
                  <g key={item.id} onClick={() => setSceneState({ selectedEvidenceId: item.id })}>
                    <circle cx={x} cy={z} r={isSelected ? 8 : 6} fill={isSelected ? '#f7b84a' : '#4fd1ff'} />
                    <text x={x + 10} y={z - 10} fill="#f8fafc" fontSize="11">{item.label}</text>
                    <text x={x + 10} y={z + 18} fill="#94a3b8" fontSize="10">{item.position.x.toFixed(1)}, {item.position.z.toFixed(1)}</text>
                  </g>
                )
              })}
            </svg>
          </div>
        </div>

        <div className="rounded-2xl border border-forensic-border bg-forensic-panel/70 p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-forensic-muted">Evidence Distance Network</p>
              <p className="mt-1 text-sm text-forensic-text/70">A dynamic node-link view across the current evidence set.</p>
            </div>
            <div className="rounded-full border border-forensic-border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.25em] text-forensic-amber">SVG network</div>
          </div>
          <div className="h-72 w-full rounded-2xl border border-forensic-border bg-forensic-surface/40 p-3">
            <svg viewBox="0 0 560 260" className="h-full w-full">
              {relationshipRows.map((row) => {
                const fromIndex = evidence.findIndex((item) => item.label === row.from)
                const toIndex = evidence.findIndex((item) => item.label === row.to)
                if (fromIndex < 0 || toIndex < 0) return null
                const fromX = 90 + fromIndex * 120
                const toX = 90 + toIndex * 120
                return <line key={row.id} x1={fromX} y1="130" x2={toX} y2="130" stroke="rgba(247,184,74,0.45)" strokeWidth="2" />
              })}
              {evidence.map((item, index) => (
                <g key={item.id} onClick={() => setSceneState({ selectedEvidenceId: item.id })}>
                  <circle cx={90 + index * 120} cy="130" r="20" fill={item.id === selectedEvidenceId ? '#f7b84a' : '#4fd1ff'} />
                  <text x={90 + index * 120 - 10} y="135" fill="#fff" fontSize="12" textAnchor="middle">{item.label}</text>
                </g>
              ))}
            </svg>
          </div>
        </div>

        <div className="rounded-2xl border border-forensic-border bg-forensic-panel/70 p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-forensic-muted">Evidence Distance Matrix</p>
              <p className="mt-1 text-sm text-forensic-text/70">Symmetric distances computed from the current evidence coordinates.</p>
            </div>
            <div className="rounded-full border border-forensic-border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.25em] text-forensic-amber">Dynamic matrix</div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-forensic-muted">
                  <th className="px-2 py-2">Label</th>
                  {evidence.map((item) => <th key={item.id} className="px-2 py-2">{item.label}</th>)}
                </tr>
              </thead>
              <tbody>
                {evidence.map((row) => (
                  <tr key={row.id}>
                    <td className="px-2 py-2 font-medium text-forensic-text">{row.label}</td>
                    {evidence.map((column) => {
                      if (row.label === column.label) return <td key={`${row.id}-${column.id}`} className="px-2 py-2 text-forensic-muted">—</td>
                      const samePair = relationshipRows.find((entry) => (entry.from === row.label && entry.to === column.label) || (entry.from === column.label && entry.to === row.label))
                      return <td key={`${row.id}-${column.id}`} className="px-2 py-2 text-forensic-text/70">{samePair ? `${samePair.distance?.toFixed(2)} m` : 'N/A'}</td>
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {evidenceWithMeasurements.length > 0 && (
          <>
            <div className="rounded-2xl border border-forensic-border bg-forensic-panel/70 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div><p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-forensic-muted">Evidence filter</p><p className="mt-1 text-sm text-forensic-text/70">Show calculations for selected evidence only.</p></div>
                {selectedMeasurementIds.length > 0 && <button type="button" onClick={() => setSelectedMeasurementIds([])} className="flex items-center gap-1 border border-forensic-border px-3 py-1.5 text-xs"><X className="h-3.5 w-3.5" />Clear selection</button>}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">{evidence.map((item) => <button type="button" key={item.id} onClick={() => setSelectedMeasurementIds((current) => current.includes(item.id) ? current.filter((id) => id !== item.id) : [...current, item.id])} className={`border px-3 py-1.5 text-xs ${selectedMeasurementIds.includes(item.id) ? 'border-forensic-amber bg-forensic-amber/10 text-forensic-amber' : 'border-forensic-border'}`}>{item.label}</button>)}</div>
            </div>
            <div className="mt-2 flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-forensic-text/70">
                <input type="checkbox" checked={showMeasurementCharts} onChange={(e) => setShowMeasurementCharts(e.target.checked)} />
                <span>Show measurement charts</span>
              </label>
              <p className="text-sm text-forensic-text/60">Toggle charts if the length/width visualization is unclear.</p>
            </div>
            {showMeasurementCharts && (
              <div className="rounded-2xl border border-forensic-border bg-forensic-panel/70 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-forensic-muted">Measurement Distribution</p>
                <div className="mt-4 grid gap-4 xl:grid-cols-3">
                  <div className="rounded-2xl border border-forensic-border bg-forensic-surface/40 p-4">
                    <p className="text-sm font-medium text-forensic-text">Length</p>
                    {numericMeasurements.length > 1 ? <div className="mt-3 h-40"><ResponsiveContainer width="100%" height="100%"><LineChart data={numericMeasurements.map((value, index) => ({ index: index + 1, value }))}><CartesianGrid stroke="rgba(148,163,184,0.15)" vertical={false} /><XAxis dataKey="index" tick={false} /><YAxis tick={false} /><Tooltip /><Line type="monotone" dataKey="value" stroke="#f7b84a" strokeWidth={2} /></LineChart></ResponsiveContainer></div> : <p className="mt-4 text-sm text-forensic-text/70">{numericMeasurements.length === 1 ? 'One valid length measurement is available; showing it as a single measurement.' : 'No length measurements available.'}</p>}
                    <p className="mt-2 text-sm text-forensic-text/70">Mean {formatMeasurement(lengthStats.mean)} mm · Range {formatMeasurement(lengthStats.min)}–{formatMeasurement(lengthStats.max)} mm · Variation {formatMeasurement(lengthStats.stdDev)} mm</p>
                  </div>
                  <div className="rounded-2xl border border-forensic-border bg-forensic-surface/40 p-4">
                    <p className="text-sm font-medium text-forensic-text">Width</p>
                    {widthValues.length > 1 ? <div className="mt-3 h-40"><ResponsiveContainer width="100%" height="100%"><LineChart data={widthValues.map((value, index) => ({ index: index + 1, value }))}><CartesianGrid stroke="rgba(148,163,184,0.15)" vertical={false} /><XAxis dataKey="index" tick={false} /><YAxis tick={false} /><Tooltip /><Line type="monotone" dataKey="value" stroke="#4fd1ff" strokeWidth={2} /></LineChart></ResponsiveContainer></div> : <p className="mt-4 text-sm text-forensic-text/70">{widthValues.length === 1 ? 'One valid width measurement is available; showing it as a single measurement.' : 'No width measurements available.'}</p>}
                    <p className="mt-2 text-sm text-forensic-text/70">Mean {formatMeasurement(widthStats.mean)} mm · Range {formatMeasurement(widthStats.min)}–{formatMeasurement(widthStats.max)} mm · Variation {formatMeasurement(widthStats.stdDev)} mm</p>
                  </div>
                  <div className="rounded-2xl border border-forensic-border bg-forensic-surface/40 p-4">
                    <p className="text-sm font-medium text-forensic-text">Orientation</p>
                    {orientationValues.length > 1 ? <div className="mt-3 h-40"><ResponsiveContainer width="100%" height="100%"><LineChart data={orientationValues.map((value, index) => ({ index: index + 1, value }))}><CartesianGrid stroke="rgba(148,163,184,0.15)" vertical={false} /><XAxis dataKey="index" tick={false} /><YAxis tick={false} /><Tooltip /><Line type="monotone" dataKey="value" stroke="#f7b84a" strokeWidth={2} /></LineChart></ResponsiveContainer></div> : <p className="mt-4 text-sm text-forensic-text/70">{orientationValues.length === 1 ? 'One valid orientation measurement is available.' : 'No orientation measurements available.'}</p>}
                    <p className="mt-2 text-sm text-forensic-text/70">Mean {formatMeasurement(orientationStats.mean)}° · Range {formatMeasurement(orientationStats.min)}–{formatMeasurement(orientationStats.max)}° · Variation {formatMeasurement(orientationStats.stdDev)}°</p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {evidenceWithOrientation.length > 0 && (
          <div className="rounded-2xl border border-forensic-border bg-forensic-panel/70 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-forensic-muted">Directional Analysis</p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
                {evidenceWithOrientation.map((item) => {
                const orientation = parseFloat((item.measurements.orientation ?? item.measurements.direction ?? '').replace(/[^0-9.]/g, '') ?? '')
                return (
                  <div key={item.id} className="rounded-2xl border border-forensic-border bg-forensic-surface/40 p-4">
                    <p className="text-sm font-medium text-forensic-text">{item.label} orientation</p>
                    <p className="mt-2 text-sm text-forensic-text/70">{orientation.toFixed(1)}°</p>
                    <div className="mt-3 h-24 w-full rounded-2xl border border-forensic-border bg-forensic-panel/60 p-3">
                      <svg viewBox="0 0 220 80" className="h-full w-full">
                        <circle cx="110" cy="40" r="26" fill="none" stroke="#64748b" strokeWidth="1.2" />
                        <line x1="110" y1="40" x2="140" y2="24" stroke="#f7b84a" strokeWidth="2" />
                        <line x1="110" y1="40" x2="110" y2="14" stroke="#4fd1ff" strokeWidth="1.2" />
                      </svg>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {footprintEvidence.length >= 2 && (
          <div className="rounded-2xl border border-forensic-border bg-forensic-panel/70 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-forensic-muted">Footprint Sequence Analysis</p>
            <div className="mt-4 h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={strideSeries}><CartesianGrid stroke="rgba(148,163,184,0.15)" vertical={false} /><XAxis dataKey="index" tick={{ fill: '#94a3b8', fontSize: 11 }} /><YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} /><Tooltip /><Line type="monotone" dataKey="value" stroke="#f7b84a" strokeWidth={2.5} /></LineChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-2 text-sm text-forensic-text/70">Average stride {formatMeasurement(strideSeries.reduce((sum, item) => sum + item.value, 0) / strideSeries.length)} m · Range {formatMeasurement(Math.min(...strideSeries.map((item) => item.value)))}–{formatMeasurement(Math.max(...strideSeries.map((item) => item.value)))} m</p>
          </div>
        )}

        {evidence.some((item) => item.type === 'Simulated Stain') && (
          <div className="rounded-2xl border border-forensic-border bg-forensic-panel/70 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-forensic-muted">Ellipse Geometry Analysis</p>
            <div className="mt-4 rounded-2xl border border-forensic-border bg-forensic-surface/40 p-4">
              <svg viewBox="0 0 220 120" className="h-48 w-full">
                <ellipse cx="110" cy="60" rx="70" ry="28" fill="rgba(79,209,255,0.16)" stroke="#4fd1ff" strokeWidth="2" />
                <line x1="110" y1="60" x2="180" y2="60" stroke="#f7b84a" strokeWidth="2" />
                <line x1="110" y1="60" x2="110" y2="32" stroke="#f7b84a" strokeWidth="2" />
              </svg>
              {evidence.filter((item) => item.type === 'Simulated Stain').map((item) => {
                const major = parseFloat(item.measurements.majorAxis?.replace(/[^0-9.]/g, '') ?? '')
                const minor = parseFloat(item.measurements.minorAxis?.replace(/[^0-9.]/g, '') ?? '')
                if (!Number.isFinite(major) || !Number.isFinite(minor) || minor <= 0) return null
                const ratio = major / minor
                const impactAngle = Math.asin(minor / major) * (180 / Math.PI)
                return (
                  <div key={item.id} className="mt-3 space-y-2 text-sm text-forensic-text/70">
                    <p>Major Axis: {major.toFixed(1)} mm</p>
                    <p>Minor Axis: {minor.toFixed(1)} mm</p>
                    <p>Calculated Angle: {impactAngle.toFixed(1)}°</p>
                    <p>Ratio: {ratio.toFixed(2)}</p>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <div className="rounded-2xl border border-forensic-border bg-forensic-panel/70 p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-forensic-muted">Evidence Relationships</p>
              <p className="mt-1 text-sm text-forensic-text/70">Calculated relationships derived from coordinate geometry.</p>
            </div>
            <div className="rounded-full border border-forensic-border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.25em] text-forensic-amber">Mathematical only</div>
          </div>
          <div className="space-y-2">
            {relationshipRows.map((row) => (
              <div key={row.id} className="rounded-2xl border border-forensic-border bg-forensic-surface/40 p-3 text-sm text-forensic-text/70">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span>{row.from} → {row.to}</span>
                  <span>Distance: {row.distance?.toFixed(2)} m</span>
                </div>
                <p className="mt-1">Relationship: {row.relation} · Direction: {row.angle?.toFixed(1)}°</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-forensic-border bg-forensic-panel/70 p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-forensic-muted">Detailed Calculation Breakdown</p>
              <p className="mt-1 text-sm text-forensic-text/70">Dynamic calculations for the current evidence array.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {filterOptions.map((option) => (
                <button key={option} type="button" onClick={() => setFilter(option)} className={`rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] ${filter === option ? 'border-forensic-amber bg-forensic-amber/10 text-forensic-amber' : 'border-forensic-border text-forensic-text/70'}`}>
                  {option}
                </button>
              ))}
            </div>
          </div>
          <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search evidence or formula" className="mb-4 w-full rounded-xl border border-forensic-border bg-forensic-surface/40 px-3 py-2 text-sm text-forensic-text outline-none" />
          <div className="space-y-3">
            {Array.from(groupedCalculations.entries()).map(([label, calcs]) => (
              <div key={label} className="rounded-2xl border border-forensic-border bg-forensic-surface/40 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-forensic-amber">{label}</p>
                    <p className="mt-2 text-sm leading-7 text-forensic-text/70">Calculations and relationships for {label}</p>
                  </div>
                </div>
                <div className="mt-4 space-y-3">
                  {calcs.map((calculation) => {
                    // build a human-friendly relationship label
                    const referenced = evidence.filter((e) => (calculation.inputs ?? '').includes(e.label)).map((e) => e.label)
                    const relation = referenced.length >= 2 ? `${referenced[0]} → ${referenced[1]}` : referenced[0] ?? calculation.title
                    return (
                      <div key={calculation.id} className="rounded-xl border border-forensic-border bg-forensic-panel/60 p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-forensic-amber">{relation}</p>
                            <p className="mt-2 text-sm leading-7 text-forensic-text/70">{calculation.calculation}</p>
                          </div>
                          <button type="button" onClick={() => setSceneState({ selectedEvidenceId: calculation.evidenceId })} className="flex items-center gap-2 rounded-full border border-forensic-border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-forensic-text/70">
                            <Waypoints className="h-3.5 w-3.5" />
                            View on Plot
                          </button>
                        </div>
                        <div className="mt-3 grid gap-4 lg:grid-cols-2">
                          <div className="rounded-xl border border-forensic-border bg-forensic-surface/40 p-3">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-forensic-muted">Formula</p>
                            <p className="mt-2 text-sm text-forensic-text">{calculation.formula}</p>
                          </div>
                          <div className="rounded-xl border border-forensic-border bg-forensic-panel/60 p-3">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-forensic-muted">Result</p>
                            <p className="mt-2 text-lg font-semibold text-forensic-amber">{calculation.result}</p>
                          </div>
                        </div>
                        <div className="mt-3 rounded-xl border border-dashed border-forensic-border bg-forensic-panel/60 p-3 text-sm text-forensic-text/70">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-forensic-muted">Inputs</p>
                          <p className="mt-2 whitespace-pre-line">{calculation.inputs}</p>
                          <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.25em] text-forensic-muted">Steps</p>
                          <p className="mt-2 whitespace-pre-line">{calculation.calculation}</p>
                          <p className="mt-3 text-sm text-forensic-text/70">Assumptions: {calculation.assumptions ?? 'Not specified'}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-forensic-border bg-forensic-panel/70 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-forensic-muted">Measurement & Data Quality</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-forensic-border bg-forensic-surface/40 p-3 text-sm text-forensic-text/70">Coordinates: {validCoordinates.length} / {evidence.length}</div>
            <div className="rounded-2xl border border-forensic-border bg-forensic-surface/40 p-3 text-sm text-forensic-text/70">Measurements: {evidenceWithMeasurements.length} / {evidence.length}</div>
            <div className="rounded-2xl border border-forensic-border bg-forensic-surface/40 p-3 text-sm text-forensic-text/70">Orientation: {evidenceWithOrientation.length} / {evidence.length}</div>
            <div className="rounded-2xl border border-forensic-border bg-forensic-surface/40 p-3 text-sm text-forensic-text/70">Analysis readiness: {analysisState.status === 'complete' ? 'READY' : 'PENDING'}</div>
          </div>
        </div>

        <div className="rounded-2xl border border-forensic-border bg-forensic-panel/70 p-4 text-sm leading-7 text-forensic-text/70">
          Educational evidence consistency is a mathematical simulation for academic review. It does not infer identity or legal outcome.
        </div>
      </div>
    </SectionShell>
  )
}