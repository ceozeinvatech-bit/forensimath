import { useState } from 'react'
import { useInvestigationStore } from '../../../store/investigationStore'
import SectionShell from './SectionShell'

const steps = [
  {
    id: 'plot',
    title: 'Step 01 • Plot Evidence',
    description: 'Place the evidence markers into the scene and confirm their positions.',
    formula: 'Evidence markers are positioned from user-entered coordinates.',
    result: 'Scene prepared for mathematical interpretation.',
  },
  {
    id: 'distance',
    title: 'Step 02 • Calculate Distances',
    description: 'Measure the separation between evidence points using the distance formula.',
    formula: 'd = √((x₂ − x₁)² + (z₂ − z₁)²)',
    result: '4.64 metres between E01 and E02.',
  },
  {
    id: 'direction',
    title: 'Step 03 • Calculate Directions',
    description: 'Determine the angular direction from one point to another.',
    formula: 'θ = tan⁻¹(Δz / Δx)',
    result: '52.9° from the positive x-axis.',
  },
  {
    id: 'trajectory',
    title: 'Step 04 • Construct Trajectory',
    description: 'Connect the evidence markers into a hypothetical movement path.',
    formula: 'A path is constructed from the selected scenario points.',
    result: 'A visual trajectory is generated for comparison.',
  },
  {
    id: 'compare',
    title: 'Step 05 • Compare Scenario',
    description: 'Measure how well the scenario aligns with the evidence.',
    formula: 'Consistency index = mathematical alignment score',
    result: 'Scenario values are compared visually and numerically.',
  },
  {
    id: 'reconstruct',
    title: 'Step 06 • Visualize Reconstruction',
    description: 'Display the reconstruction in 2D and 3D for educational review.',
    formula: 'Scene state is reused across representations.',
    result: 'The same evidence drives the 2D and 3D visualizations.',
  },
]

export default function TimelineSection() {
  const activeScenario = useInvestigationStore((state) => state.scenarios.find((scenario) => scenario.id === state.activeScenarioId))
  const [currentStep, setCurrentStep] = useState(1)
  const activeStep = steps[currentStep]

  return (
    <SectionShell
      title="MATHEMATICAL RECONSTRUCTION"
      subtitle="Step-by-step educational walkthrough"
      action={
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCurrentStep((value) => Math.max(0, value - 1))}
            className="cursor-pointer border border-forensic-border px-3 py-2 font-[family-name:var(--font-mono)] text-[10px] tracking-[0.2em] text-slate-300 uppercase transition-colors hover:border-forensic-amber hover:text-forensic-amber"
          >
            ◀ Previous
          </button>
          <button
            type="button"
            onClick={() => setCurrentStep((value) => (value + 1) % steps.length)}
            className="cursor-pointer border border-forensic-amber/50 bg-forensic-amber/10 px-3 py-2 font-[family-name:var(--font-mono)] text-[10px] tracking-[0.2em] text-forensic-amber uppercase transition-colors hover:border-forensic-amber hover:bg-forensic-amber/20"
          >
            Next ▶
          </button>
        </div>
      }
    >
      <div className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="space-y-3">
          {steps.map((step, index) => {
            const isActive = index === currentStep
            return (
              <div
                key={step.id}
                className={`rounded-2xl border p-4 transition-all ${isActive ? 'border-forensic-amber bg-forensic-amber/10 shadow-[0_10px_24px_rgba(247,184,74,0.12)]' : 'border-forensic-border bg-forensic-panel/70'}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-forensic-muted">{step.title}</p>
                    <p className="mt-2 text-sm leading-6 text-forensic-text/70">{step.description}</p>
                  </div>
                  <div className={`mt-1 h-2.5 w-2.5 rounded-full ${isActive ? 'bg-forensic-amber' : 'bg-forensic-border'}`} />
                </div>
              </div>
            )
          })}
        </div>

        <div className="rounded-2xl border border-forensic-border bg-forensic-panel/70 p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-forensic-amber">{activeStep.title}</p>
          <p className="mt-2 text-sm leading-7 text-forensic-text/70">{activeStep.description}</p>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-forensic-border bg-forensic-surface/40 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-forensic-muted">Formula</p>
              <p className="mt-2 text-sm leading-6 text-forensic-text">{activeStep.formula}</p>
            </div>
            <div className="rounded-2xl border border-forensic-border bg-forensic-surface/40 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-forensic-muted">Result</p>
              <p className="mt-2 text-sm leading-6 text-forensic-text/70">{activeStep.result}</p>
            </div>
          </div>
          <div className="mt-4 rounded-2xl border border-dashed border-forensic-border bg-forensic-surface/30 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-forensic-muted">Active Scenario</p>
            <p className="mt-2 text-sm font-medium text-forensic-text">{activeScenario?.name ?? 'No active scenario'}</p>
            <p className="mt-1 text-sm leading-6 text-forensic-text/70">{activeScenario?.description ?? 'Select a scenario to bridge the reconstruction timeline to the scenario engine.'}</p>
          </div>
        </div>
      </div>
    </SectionShell>
  )
}
