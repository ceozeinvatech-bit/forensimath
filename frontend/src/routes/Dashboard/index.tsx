import { motion } from 'framer-motion'
import { useMemo } from 'react'
import { Calculator, CircleDashed, FilePlus2, FileText, GitBranch, Route, type LucideIcon } from 'lucide-react'
import CommandCenterLayout from '../../components/dashboard/CommandCenterLayout'
import InvestigationProgress from '../../components/dashboard/InvestigationProgress'
import CaseInfoSection from '../../components/dashboard/sections/CaseInfoSection'
import EvidenceSection from '../../components/dashboard/sections/EvidenceSection'
import MathEngineSection from '../../components/dashboard/sections/MathEngineSection'
import OpenCVSection from '../../components/dashboard/sections/OpenCVSection'
import ScenariosSection from '../../components/dashboard/sections/ScenariosSection'
import Scene2DSection from '../../components/dashboard/sections/Scene2DSection'
import TimelineSection from '../../components/dashboard/sections/TimelineSection'
import SummarySection from '../../components/dashboard/sections/SummarySection'
import { useInvestigationStore } from '../../store/investigationStore'

type WorkflowStatus = 'completed' | 'in-progress' | 'available' | 'not-started'

type WorkflowStepConfig = {
  id: string
  label: string
  description: string
  icon: LucideIcon
  status: WorkflowStatus
  section: string
  disabled?: boolean
}

function getWorkflowSteps(state: {
  evidence: Array<{ id: string; measurements: Record<string, string | undefined> }>;
  calculations: Array<{ id: string }>;
  scenarios: Array<{ id: string }>;
  reconstructionGenerated: boolean;
  summaryGenerated: boolean;
  activeSection: string;
  activeCase: string;
  analysisState: { status: string };
}): WorkflowStepConfig[] {
  const hasCase = Boolean(state.activeCase)
  const hasEvidence = state.evidence.length > 0
  const hasMeasurements = state.evidence.some((entry) => Object.values(entry.measurements).some(Boolean))
  const hasCalculations = state.calculations.length > 0
  const hasScenarios = state.scenarios.length > 0
  const hasReconstruction = state.reconstructionGenerated
  const hasSummary = state.summaryGenerated

  const getCaseStatus = (): WorkflowStatus => {
    if (!hasCase) return 'not-started'
    return 'completed'
  }

  const getEvidenceStatus = (): WorkflowStatus => {
    if (!hasEvidence) return 'not-started'
    if (hasMeasurements) return 'completed'
    return 'in-progress'
  }

  const getAnalysisStatus = (): WorkflowStatus => {
    if (!hasEvidence) return 'not-started'
    if (state.analysisState.status === 'running') return 'in-progress'
    if (hasCalculations) return 'completed'
    if (hasEvidence) return 'available'
    return 'not-started'
  }

  const getScenariosStatus = (): WorkflowStatus => {
    if (!hasCalculations) return 'not-started'
    if (!hasScenarios) return 'available'
    return 'completed'
  }

  const getReconstructionStatus = (): WorkflowStatus => {
    if (!hasScenarios) return 'not-started'
    if (hasReconstruction) return 'completed'
    return 'available'
  }

  const getSummaryStatus = (): WorkflowStatus => {
    if (!hasReconstruction) return 'not-started'
    if (hasSummary) return 'completed'
    return 'available'
  }

  return [
    {
      id: 'case',
      label: 'Case',
      description: hasCase ? 'Case profile prepared for analysis' : 'Create the case profile to begin',
      icon: FilePlus2,
      status: getCaseStatus(),
      section: 'Case Info',
    },
    {
      id: 'evidence',
      label: 'Evidence',
      description: hasEvidence ? 'Evidence collection is ready for review' : 'Add evidence to build the reconstruction',
      icon: CircleDashed,
      status: getEvidenceStatus(),
      section: 'Evidence',
    },
    {
      id: 'analysis',
      label: 'Analysis',
      description: hasCalculations ? 'Mathematical analysis completed' : 'Run calculations across all evidence',
      icon: Calculator,
      status: getAnalysisStatus(),
      section: 'Math Engine',
    },
    {
      id: 'scenarios',
      label: 'Scenarios',
      description: hasScenarios ? 'Scenario set is active' : 'Create and compare reconstruction hypotheses',
      icon: GitBranch,
      status: getScenariosStatus(),
      section: 'Scenarios',
    },
    {
      id: 'reconstruction',
      label: 'Reconstruction',
      description: hasReconstruction ? 'Reconstruction data is ready' : 'Generate the 2D reconstruction view',
      icon: Route,
      status: getReconstructionStatus(),
      section: '2D Scene',
    },
    {
      id: 'summary',
      label: 'Summary',
      description: hasSummary ? 'Report is ready for review' : 'Prepare the final educational summary',
      icon: FileText,
      status: getSummaryStatus(),
      section: 'Summary',
    },
  ]
}

export default function Dashboard() {
  const activeSection = useInvestigationStore((state) => state.activeSection)
  const setActiveSection = useInvestigationStore((state) => state.setActiveSection)
  const evidence = useInvestigationStore((state) => state.evidence)
  const calculations = useInvestigationStore((state) => state.calculations)
  const scenarios = useInvestigationStore((state) => state.scenarios)
  const reconstructionGenerated = useInvestigationStore((state) => state.reconstructionGenerated)
  const summaryGenerated = useInvestigationStore((state) => state.summaryGenerated)
  const activeCase = useInvestigationStore((state) => state.activeCase)
  const analysisState = useInvestigationStore((state) => state.analysisState)

  const workflowSteps = useMemo(() => getWorkflowSteps({ evidence, calculations, scenarios, reconstructionGenerated, summaryGenerated, activeSection, activeCase, analysisState }), [evidence, calculations, scenarios, reconstructionGenerated, summaryGenerated, activeSection, activeCase, analysisState])

  const currentSection = useMemo(() => {
    switch (activeSection) {
      case 'Evidence':
        return <EvidenceSection />
      case 'Math Engine':
        return <MathEngineSection />
      case 'OpenCV':
        return <OpenCVSection />
      case 'Scenarios':
        return <ScenariosSection />
      case '2D Scene':
        return <Scene2DSection />
      case 'Timeline':
        return <TimelineSection />
      case 'Summary':
        return <SummarySection />
      case 'Case Info':
      default:
        return <CaseInfoSection />
    }
  }, [activeSection])

  const handleStepClick = (section: string) => {
    setActiveSection(section)
  }

  const stepsWithHandlers = workflowSteps.map((step) => ({
    ...step,
    onClick: () => handleStepClick(step.section),
    disabled: step.status === 'not-started' && step.id !== 'case' && step.id !== 'evidence' && step.id !== 'analysis',
  }))

  return (
    <CommandCenterLayout activeNavItem={activeSection} onNavSelect={setActiveSection}>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex h-full flex-col gap-4"
      >
        <div className="rounded-2xl border border-forensic-border/80 bg-gradient-to-br from-forensic-panel/90 to-forensic-surface/70 p-4 shadow-[0_20px_45px_rgba(2,6,23,0.18)] sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-forensic-amber">
                Investigation Flow
              </p>
              <h2 className="mt-1 text-2xl font-semibold text-forensic-text">
                Guided mathematical reconstruction workspace
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-forensic-text/70">
                Build a simulated case, add evidence, and follow how each measurement becomes an educational result.
              </p>
            </div>
          </div>

          <div className="mt-4">
            <InvestigationProgress steps={stepsWithHandlers} />
          </div>
        </div>

        {currentSection}
      </motion.div>
    </CommandCenterLayout>
  )
}
