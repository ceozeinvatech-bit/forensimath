import { ArrowRight, Circle, CircleCheckBig, CircleDot, LoaderCircle, type LucideIcon } from 'lucide-react'

type WorkflowStep = {
  id: string
  label: string
  status: 'completed' | 'in-progress' | 'not-started' | 'available'
  description: string
  icon: LucideIcon
  onClick?: () => void
  disabled?: boolean
}

type InvestigationProgressProps = {
  steps: WorkflowStep[]
}

export default function InvestigationProgress({ steps }: InvestigationProgressProps) {
  const getStatusClass = (status: WorkflowStep['status']) => {
    switch (status) {
      case 'completed':
        return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
      case 'in-progress':
        return 'border-amber-500/40 bg-amber-500/10 text-amber-300'
      case 'available':
        return 'border-sky-500/30 bg-sky-500/10 text-sky-200'
      default:
        return 'border-forensic-border bg-forensic-surface/60 text-forensic-text/70'
    }
  }

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {steps.map((step) => {
        const isCompleted = step.status === 'completed'
        const isInProgress = step.status === 'in-progress'
        const isAvailable = step.status === 'available'
        const isDisabled = step.disabled

        return (
          <button
            key={step.id}
            type="button"
            onClick={() => !isDisabled && step.onClick?.()}
            className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition-all duration-200 ${getStatusClass(step.status)} ${isDisabled ? 'opacity-70' : 'hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(2,6,23,0.18)]'}`}
          >
            <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/10">
              {isCompleted ? <CircleCheckBig className="h-5 w-5" /> : isInProgress ? <LoaderCircle className="h-5 w-5 animate-spin" /> : isAvailable ? <ArrowRight className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-[0.24em]">{step.label}</span>
                {isInProgress && <CircleDot className="h-3.5 w-3.5" />}
              </div>
              <p className="mt-1 text-sm leading-5">{step.description}</p>
            </div>
          </button>
        )
      })}
    </div>
  )
}
