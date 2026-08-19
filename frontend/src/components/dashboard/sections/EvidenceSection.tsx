import { useMemo, useState } from 'react'
import { useInvestigationStore } from '../../../store/investigationStore'
import SectionShell from './SectionShell'

type EvidenceFormState = {
  label: string
  type: string
  description: string
  positionX: string
  positionY: string
  positionZ: string
  length: string
  width: string
  majorAxis: string
  minorAxis: string
  notes: string
}

type MeasurementField = 'length' | 'width' | 'majorAxis' | 'minorAxis' | 'notes'

const measurementFieldsForType = (type: string): MeasurementField[] => {
  switch (type) {
    case 'Footprint':
    case 'Footwear Impression':
      return ['length', 'width', 'notes']
    case 'Simulated Stain':
      return ['majorAxis', 'minorAxis', 'notes']
    case 'Object':
      return ['length', 'width', 'notes']
    case 'Measurement':
      return ['notes']
    case 'Position':
    case 'Trajectory':
    case 'Custom':
    default:
      return ['notes']
  }
}

const measurementLabels: Record<MeasurementField, string> = {
  length: 'Length (mm)',
  width: 'Width (mm)',
  majorAxis: 'Major axis (mm)',
  minorAxis: 'Minor axis (mm)',
  notes: 'Measurement notes',
}

const emptyForm: EvidenceFormState = {
  label: '',
  type: 'Footprint',
  description: '',
  positionX: '0',
  positionY: '0',
  positionZ: '0',
  length: '',
  width: '',
  majorAxis: '',
  minorAxis: '',
  notes: '',
}

export default function EvidenceSection() {
  const evidence = useInvestigationStore((state) => state.evidence)
  const addEvidence = useInvestigationStore((state) => state.addEvidence)
  const removeEvidence = useInvestigationStore((state) => state.removeEvidence)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [form, setForm] = useState<EvidenceFormState>(emptyForm)
  const [validationMessage, setValidationMessage] = useState('')

  const evidenceTypes = useMemo(
    () => ['Footprint', 'Simulated Stain', 'Object', 'Position', 'Trajectory', 'Measurement', 'Custom'],
    [],
  )

  const handleSubmit = () => {
    if (!form.label.trim()) {
      setValidationMessage('Evidence label is required.')
      return
    }

    if (!form.description.trim()) {
      setValidationMessage('Description is required.')
      return
    }

    const numericX = Number(form.positionX)
    const numericY = Number(form.positionY)
    const numericZ = Number(form.positionZ)

    if ([numericX, numericY, numericZ].some((value) => Number.isNaN(value))) {
      setValidationMessage('Position fields must be numeric.')
      return
    }

    const fields = measurementFieldsForType(form.type)
    const measurements = fields.reduce<Record<string, string>>((result, field) => {
      const value = form[field].trim()
      if (value) result[field] = value
      return result
    }, {})

    addEvidence({
      label: form.label.trim(),
      type: form.type,
      description: form.description.trim(),
      position: { x: numericX, y: numericY, z: numericZ },
      measurements,
    })

    setForm(emptyForm)
    setValidationMessage('')
    setIsModalOpen(false)
  }

  return (
    <SectionShell
      title="EVIDENCE COLLECTION"
      subtitle="Add and organize simulated evidence items"
      action={
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="cursor-pointer rounded-xl border border-forensic-amber/60 bg-forensic-amber px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-forensic-bg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(247,184,74,0.25)]"
        >
          + Add Evidence
        </button>
      }
    >
      <div className="space-y-4">
        <div className="rounded border border-forensic-border bg-forensic-surface/40 p-4 text-sm text-slate-400">
          Add evidence items to build an explainable mathematical reconstruction. Each item can be measured, related, and visualized across the scene.
        </div>

        <div className="grid gap-4">
          {evidence.map((item) => (
            <div key={item.id} className="rounded border border-forensic-border bg-forensic-panel/70 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-[family-name:var(--font-mono)] text-[11px] tracking-[0.25em] text-forensic-amber uppercase">
                      {item.label}
                    </p>
                    <span className="rounded-full border border-forensic-border px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-forensic-muted">
                      {item.type}
                    </span>
                  </div>
                  <p className="mt-2 text-lg font-semibold text-forensic-text">{item.label}</p>
                  <p className="mt-1 text-sm leading-relaxed text-slate-400">{item.description}</p>
                </div>
                <button
                  type="button"
                  onClick={() => removeEvidence(item.id)}
                  className="cursor-pointer rounded-xl border border-forensic-border/80 bg-white/8 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-forensic-text backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:border-forensic-accent/60 hover:bg-forensic-surface/80"
                >
                  Delete
                </button>
              </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <div>
                  <p className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.25em] text-forensic-muted uppercase">Position</p>
                  <p className="mt-1 text-sm text-slate-400">({item.position.x}, {item.position.y}, {item.position.z})</p>
                </div>
                {item.measurements.length && (
                  <div>
                    <p className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.25em] text-forensic-muted uppercase">Length</p>
                    <p className="mt-1 text-sm text-slate-400">{item.measurements.length}</p>
                  </div>
                )}
                {item.measurements.width && (
                  <div>
                    <p className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.25em] text-forensic-muted uppercase">Width</p>
                    <p className="mt-1 text-sm text-slate-400">{item.measurements.width}</p>
                  </div>
                )}
                {item.measurements.notes && (
                  <div>
                    <p className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.25em] text-forensic-muted uppercase">Notes</p>
                    <p className="mt-1 text-sm text-slate-400">{item.measurements.notes}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded border border-forensic-border bg-forensic-panel p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.3em] text-forensic-amber uppercase">Create Evidence</p>
                <h3 className="mt-1 text-lg font-semibold text-forensic-text">Add a new evidence item</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="cursor-pointer border border-forensic-border px-3 py-2 font-[family-name:var(--font-mono)] text-[10px] tracking-[0.2em] text-slate-300 uppercase transition-colors hover:border-forensic-amber hover:text-forensic-amber"
              >
                Close
              </button>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="text-sm text-slate-400">
                Label
                <input
                  value={form.label}
                  onChange={(event) => setForm({ ...form, label: event.target.value })}
                  className="mt-1 w-full border border-forensic-border bg-forensic-surface/60 px-3 py-2 text-sm text-forensic-text outline-none"
                />
              </label>
              <label className="text-sm text-slate-400">
                Type
                <select
                  value={form.type}
                  onChange={(event) => setForm({ ...form, type: event.target.value, length: '', width: '', majorAxis: '', minorAxis: '', notes: '' })}
                  className="mt-1 w-full border border-forensic-border bg-forensic-surface/60 px-3 py-2 text-sm text-forensic-text outline-none"
                >
                  {evidenceTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </label>
              <label className="md:col-span-2 text-sm text-slate-400">
                Description
                <textarea
                  value={form.description}
                  onChange={(event) => setForm({ ...form, description: event.target.value })}
                  className="mt-1 min-h-24 w-full border border-forensic-border bg-forensic-surface/60 px-3 py-2 text-sm text-forensic-text outline-none"
                />
              </label>
              <label className="text-sm text-slate-400">
                X
                <input
                  value={form.positionX}
                  onChange={(event) => setForm({ ...form, positionX: event.target.value })}
                  className="mt-1 w-full border border-forensic-border bg-forensic-surface/60 px-3 py-2 text-sm text-forensic-text outline-none"
                />
              </label>
              <label className="text-sm text-slate-400">
                Y
                <input
                  value={form.positionY}
                  onChange={(event) => setForm({ ...form, positionY: event.target.value })}
                  className="mt-1 w-full border border-forensic-border bg-forensic-surface/60 px-3 py-2 text-sm text-forensic-text outline-none"
                />
              </label>
              <label className="text-sm text-slate-400">
                Z
                <input
                  value={form.positionZ}
                  onChange={(event) => setForm({ ...form, positionZ: event.target.value })}
                  className="mt-1 w-full border border-forensic-border bg-forensic-surface/60 px-3 py-2 text-sm text-forensic-text outline-none"
                />
              </label>
              {measurementFieldsForType(form.type).map((field) => (
                <label key={field} className={`${field === 'notes' ? 'md:col-span-2' : ''} text-sm text-slate-400`}>
                  {measurementLabels[field]}
                  {field === 'notes' ? (
                    <textarea
                      value={form[field]}
                      onChange={(event) => setForm({ ...form, [field]: event.target.value })}
                      placeholder="Describe the recorded measurement or its quality."
                      className="mt-1 min-h-20 w-full border border-forensic-border bg-forensic-surface/60 px-3 py-2 text-sm text-forensic-text outline-none"
                    />
                  ) : (
                    <input
                      value={form[field]}
                      onChange={(event) => setForm({ ...form, [field]: event.target.value })}
                      placeholder={`Example: ${field === 'length' ? '270 mm' : field === 'width' ? '102 mm' : field === 'majorAxis' ? '180 mm' : '95 mm'}`}
                      className="mt-1 w-full border border-forensic-border bg-forensic-surface/60 px-3 py-2 text-sm text-forensic-text outline-none"
                    />
                  )}
                </label>
              ))}
            </div>

            {validationMessage && <p className="mt-4 text-sm text-amber-500">{validationMessage}</p>}

            <div className="mt-5 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="cursor-pointer border border-forensic-border px-4 py-2 font-[family-name:var(--font-mono)] text-[10px] tracking-[0.2em] text-slate-300 uppercase transition-colors hover:border-forensic-amber hover:text-forensic-amber"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="cursor-pointer rounded-xl border border-forensic-amber/60 bg-forensic-amber px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-forensic-bg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(247,184,74,0.25)]"
              >
                Save Evidence
              </button>
            </div>
          </div>
        </div>
      )}
    </SectionShell>
  )
}
