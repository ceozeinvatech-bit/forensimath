import { useState } from 'react'
import { useInvestigationStore } from '../../../store/investigationStore'

type CaseModalProps = {
  isOpen: boolean
  mode: 'create' | 'open'
  onClose: () => void
}

export default function CaseModal({ isOpen, mode, onClose }: CaseModalProps) {
  const createCase = useInvestigationStore((state) => state.createCase)
  const selectCase = useInvestigationStore((state) => state.selectCase)
  const deleteCase = useInvestigationStore((state) => state.deleteCase)
  const selectedCaseId = useInvestigationStore((state) => state.selectedCaseId)
  const cases = useInvestigationStore((state) => state.cases)
  const [form, setForm] = useState({ title: '', description: '', location: '', width: '12', depth: '8' })
  const [feedback, setFeedback] = useState('')

  if (!isOpen) {
    return null
  }

  const handleCreate = () => {
    if (!form.title.trim()) {
      setFeedback('Case title is required.')
      return
    }

    createCase({
      title: form.title,
      description: form.description,
      location: form.location,
      width: Number(form.width),
      depth: Number(form.depth),
    })
    setFeedback('Case created successfully.')
    setForm({ title: '', description: '', location: '', width: '12', depth: '8' })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
      <div className="w-full max-w-2xl rounded border border-forensic-border bg-forensic-panel p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.3em] text-forensic-amber uppercase">
              {mode === 'create' ? 'Create New Case' : 'Open Existing Case'}
            </p>
            <h3 className="mt-1 text-lg font-semibold text-forensic-text">
              {mode === 'create' ? 'Create a new educational case' : 'Select an existing case'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer border border-forensic-border px-3 py-2 font-[family-name:var(--font-mono)] text-[10px] tracking-[0.2em] text-slate-300 uppercase transition-colors hover:border-forensic-amber hover:text-forensic-amber"
          >
            Close
          </button>
        </div>

        {mode === 'create' ? (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="text-sm text-slate-400 md:col-span-2">
              Case Title
              <input
                value={form.title}
                onChange={(event) => setForm({ ...form, title: event.target.value })}
                className="mt-1 w-full border border-forensic-border bg-forensic-surface/60 px-3 py-2 text-sm text-forensic-text outline-none"
              />
            </label>
            <label className="text-sm text-slate-400 md:col-span-2">
              Description
              <textarea
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
                className="mt-1 min-h-24 w-full border border-forensic-border bg-forensic-surface/60 px-3 py-2 text-sm text-forensic-text outline-none"
              />
            </label>
            <label className="text-sm text-slate-400">
              Location / Scene Description
              <input
                value={form.location}
                onChange={(event) => setForm({ ...form, location: event.target.value })}
                className="mt-1 w-full border border-forensic-border bg-forensic-surface/60 px-3 py-2 text-sm text-forensic-text outline-none"
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm text-slate-400">
                Width (m)
                <input
                  value={form.width}
                  onChange={(event) => setForm({ ...form, width: event.target.value })}
                  className="mt-1 w-full border border-forensic-border bg-forensic-surface/60 px-3 py-2 text-sm text-forensic-text outline-none"
                />
              </label>
              <label className="text-sm text-slate-400">
                Depth (m)
                <input
                  value={form.depth}
                  onChange={(event) => setForm({ ...form, depth: event.target.value })}
                  className="mt-1 w-full border border-forensic-border bg-forensic-surface/60 px-3 py-2 text-sm text-forensic-text outline-none"
                />
              </label>
            </div>
            <div className="md:col-span-2 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="cursor-pointer border border-forensic-border px-4 py-2 font-[family-name:var(--font-mono)] text-[10px] tracking-[0.2em] text-slate-300 uppercase transition-colors hover:border-forensic-amber hover:text-forensic-amber"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreate}
                className="cursor-pointer border border-forensic-amber/50 bg-forensic-amber/10 px-4 py-2 font-[family-name:var(--font-mono)] text-[10px] tracking-[0.2em] text-forensic-amber uppercase transition-colors hover:border-forensic-amber hover:bg-forensic-amber/20"
              >
                Create Case
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-4">
            <div className="space-y-3 max-h-[50vh] overflow-auto pr-2">
            {cases.length === 0 ? (
              <div className="rounded border border-dashed border-forensic-border bg-forensic-surface/30 p-4 text-sm text-slate-400">
                No cases are available yet. Create one to start the investigation flow.
              </div>
            ) : (
              cases.map((caseItem) => {
                const isActive = selectedCaseId === caseItem.id
                return (
                  <div key={caseItem.id} className={`rounded border p-4 transition-colors ${isActive ? 'border-forensic-amber bg-forensic-surface/70' : 'border-forensic-border bg-forensic-surface/50'}`}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.25em] text-forensic-amber uppercase">{caseItem.caseCode}</p>
                        <p className="mt-1 text-sm font-semibold text-forensic-text">{caseItem.title}</p>
                        <p className="mt-1 text-sm text-slate-400">{caseItem.description}</p>
                      </div>
                      <div className="text-right text-xs text-slate-400">
                        <p>{caseItem.evidence.length} evidence</p>
                        <p>{caseItem.scenarios.length} scenarios</p>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                      <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
                        {isActive ? 'Currently Active' : 'Ready to Open'}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            selectCase(caseItem.id)
                            setFeedback(`${caseItem.title} is now active.`)
                            onClose()
                          }}
                          className="cursor-pointer border border-forensic-amber/50 bg-forensic-amber/10 px-3 py-2 font-[family-name:var(--font-mono)] text-[10px] tracking-[0.2em] text-forensic-amber uppercase transition-colors hover:border-forensic-amber hover:bg-forensic-amber/20"
                        >
                          Open
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            const ok = window.confirm(`Delete Case?\n\nThis will permanently delete this case and its associated\nevidence, scenarios, calculations, and analysis results.`)
                            if (!ok) return
                            try {
                              await deleteCase(caseItem.id)
                              setFeedback(`${caseItem.title} was removed.`)
                            } catch (err) {
                              setFeedback('Failed to delete case.')
                            }
                          }}
                          className="cursor-pointer border border-rose-400/50 bg-rose-400/10 px-3 py-2 font-[family-name:var(--font-mono)] text-[10px] tracking-[0.2em] text-rose-300 uppercase transition-colors hover:border-rose-400 hover:bg-rose-400/20"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
            </div>
          </div>
        )}

        {feedback && <p className="mt-3 text-sm text-amber-500">{feedback}</p>}
      </div>
    </div>
  )
}
