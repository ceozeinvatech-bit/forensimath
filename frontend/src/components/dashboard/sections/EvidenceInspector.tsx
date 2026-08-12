import { useInvestigationStore } from '../../../store/investigationStore'

type EvidenceInspectorProps = {
  selectedEvidenceId: string | null
}

export default function EvidenceInspector({ selectedEvidenceId }: EvidenceInspectorProps) {
  const evidence = useInvestigationStore((state) => state.evidence)
  const selectedEvidence = evidence.find((item) => item.id === selectedEvidenceId)

  if (!selectedEvidence) {
    return (
      <div className="rounded border border-forensic-border bg-forensic-panel/70 p-4 text-sm text-slate-400">
        Select an evidence item to inspect its mathematical and spatial details.
      </div>
    )
  }

  const measurements = selectedEvidence.measurements
  const distanceToReference = Math.hypot(selectedEvidence.position.x - 2.4, selectedEvidence.position.z - 3.1).toFixed(2)

  return (
    <div className="rounded border border-forensic-border bg-forensic-panel/70 p-4">
      <p className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.25em] text-forensic-amber uppercase">{selectedEvidence.label}</p>
      <h4 className="mt-2 text-lg font-semibold text-forensic-text">{selectedEvidence.type}</h4>
      <p className="mt-2 text-sm leading-relaxed text-slate-400">{selectedEvidence.description}</p>

      <div className="mt-4 space-y-3 text-sm text-slate-400">
        <div className="rounded border border-forensic-border bg-forensic-surface/40 p-3">
          <p className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.25em] text-forensic-muted uppercase">Position</p>
          <p className="mt-2">X: {selectedEvidence.position.x.toFixed(2)} m</p>
          <p>Z: {selectedEvidence.position.z.toFixed(2)} m</p>
        </div>
        {measurements.length && <p>Length: {measurements.length}</p>}
        {measurements.width && <p>Width: {measurements.width}</p>}
        {measurements.orientation && <p>Orientation: {measurements.orientation}</p>}
        {measurements.angle && <p>Angle: {measurements.angle}</p>}
        {measurements.majorAxis && <p>Major Axis: {measurements.majorAxis}</p>}
        {measurements.minorAxis && <p>Minor Axis: {measurements.minorAxis}</p>}
        <p>Distance to reference (2.4,3.1): {distanceToReference} m</p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className="cursor-pointer rounded-xl border border-forensic-amber/60 bg-forensic-amber px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-forensic-bg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(247,184,74,0.25)]">
          Analyze
        </button>
        <button type="button" className="cursor-pointer border border-forensic-border px-3 py-2 font-[family-name:var(--font-mono)] text-[10px] tracking-[0.2em] text-slate-300 uppercase transition-colors hover:border-forensic-amber hover:text-forensic-amber">
          Move Evidence
        </button>
        <button type="button" className="cursor-pointer border border-forensic-border px-3 py-2 font-[family-name:var(--font-mono)] text-[10px] tracking-[0.2em] text-slate-300 uppercase transition-colors hover:border-forensic-amber hover:text-forensic-amber">
          Reset
        </button>
      </div>
    </div>
  )
}
