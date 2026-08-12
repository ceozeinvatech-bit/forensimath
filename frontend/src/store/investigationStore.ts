import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import api from '../services/api'

type EvidenceItem = {
  id: string
  label: string
  type: string
  description: string
  position: { x: number; y: number; z: number }
  measurements: {
    length?: string
    width?: string
    majorAxis?: string
    minorAxis?: string
    notes?: string
    orientation?: string
    angle?: string
    radius?: string
    direction?: string
  }
}

type ScenarioItem = {
  id: string
  name: string
  description: string
  movementType: string
  pathPoints: Array<{ x: number; y: number; z: number }>
  analysisStatus?: string
  analysisCounts?: { supporting: number; conflicting: number; unresolved: number }
  analysisConflicts?: Array<any>
  analysisGaps?: string[]
  analysisRecommendations?: string[]
  explanation?: string
  insights?: {
    plain_language_explanation?: string
  }
}

type CalculationItem = {
  id: string
  evidenceId: string
  title: string
  formula: string
  inputs: string
  calculation: string
  result: string
  assumptions: string
  units: string
  category: 'distance' | 'measurement' | 'position' | 'direction' | 'ellipse' | 'stride'
}

type CaseRecord = {
  id: string
  caseCode: string
  title: string
  description: string
  location: string
  dimensions: { width: number; depth: number }
  createdAt: string
  evidence: EvidenceItem[]
  scenarios: ScenarioItem[]
  calculations: CalculationItem[]
  sceneState: {
    evidenceIds: string[]
    selectedEvidenceId: string | null
    hasImage: boolean
  }
}

type AnalysisStepStatus = 'pending' | 'calculating' | 'complete'

type AnalysisState = {
  isRunning: boolean
  status: 'idle' | 'running' | 'complete'
  completedCount: number
  totalCount: number
  progressItems: Array<{ id: string; label: string; status: AnalysisStepStatus }>
  lastRunAt: string | null
}

type InvestigationState = {
  activeCase: string
  activeSection: string
  selectedCaseId: string
  cases: CaseRecord[]
  evidence: EvidenceItem[]
  scenarios: ScenarioItem[]
  activeScenarioId: string
  calculations: CalculationItem[]
  sceneState: {
    evidenceIds: string[]
    selectedEvidenceId: string | null
    hasImage: boolean
  }
  theme: 'dark' | 'light'
  currentModule: string
  analysisResults: Array<{ id: string; name: string; result: string }>
  reconstructionGenerated: boolean
  summaryGenerated: boolean
  analysisState: AnalysisState
  loading: boolean
  creatingCase: boolean
  deletingCase: boolean
  setActiveSection: (section: string) => void
  setTheme: (theme: 'dark' | 'light') => void
  init: () => Promise<void>
  createCase: (payload: { title: string; description: string; location: string; width: number; depth: number }) => Promise<void>
  selectCase: (caseId: string) => void
  deleteCase: (caseId: string) => Promise<void>
  addEvidence: (item: Omit<EvidenceItem, 'id'>) => Promise<void>
  updateEvidence: (id: string, item: Omit<EvidenceItem, 'id'>) => Promise<void>
  removeEvidence: (id: string) => Promise<void>
  addScenario: (item: Omit<ScenarioItem, 'id'>) => Promise<void>
  setActiveScenario: (id: string) => void
  setSceneState: (state: Partial<InvestigationState['sceneState']>) => void
  runAnalysis: () => Promise<void>
  generateReconstruction: () => Promise<void>
  generateSummary: () => Promise<void>
}

const parseMeasurementValue = (value?: string) => {
  if (!value) return null
  const match = value.match(/-?\d+(?:\.\d+)?/)
  return match ? Number(match[0]) : null
}

const createEmptyCaseState = () => ({
  selectedCaseId: '',
  activeCase: 'No Case Selected',
  activeSection: 'Case Info',
  currentModule: 'Case Info',
  evidence: [] as EvidenceItem[],
  scenarios: [] as ScenarioItem[],
  activeScenarioId: '',
  calculations: [] as CalculationItem[],
  sceneState: { evidenceIds: [] as string[], selectedEvidenceId: null as string | null, hasImage: false },
  reconstructionGenerated: false,
  summaryGenerated: false,
      summaryText: '',
  analysisState: {
    isRunning: false,
    status: 'idle' as const,
    completedCount: 0,
    totalCount: 0,
    progressItems: [] as Array<{ id: string; label: string; status: AnalysisStepStatus }>,
    lastRunAt: null as string | null,
  },
})

export const useInvestigationStore = create<InvestigationState>()(
  persist(
    (set, get) => ({
      activeCase: 'No Case Selected',
      activeSection: 'Case Info',
      selectedCaseId: '',
      cases: [],
      evidence: [],
      scenarios: [],
      activeScenarioId: '',
      calculations: [],
      sceneState: { evidenceIds: [], selectedEvidenceId: null, hasImage: false },
      theme: 'dark',
      currentModule: 'Case Info',
      analysisResults: [],
      reconstructionGenerated: false,
      summaryGenerated: false,
      analysisState: {
        isRunning: false,
        status: 'idle',
        completedCount: 0,
        totalCount: 0,
        progressItems: [],
        lastRunAt: null,
      },
      loading: false,
      creatingCase: false,
      deletingCase: false,

      setActiveSection: (section) => set({ activeSection: section, currentModule: section }),
      setTheme: (theme) => set({ theme }),

      init: async () => {
        set({ loading: true })
        try {
          const cases = await api.getCases()
          if (cases.length === 0) {
            set({ cases: [], loading: false })
            return
          }
          set({ cases, loading: false })
          const first = cases[0]
          get().selectCase(first.id)
        } catch (err) {
          console.error('Failed to load cases', err)
          set({ loading: false })
        }
      },

      createCase: async (payload) => {
        set({ creatingCase: true })
        try {
          const nextNumber = get().cases.length + 1
          const caseCode = `CASE ${String(nextNumber).padStart(2, '0')}`
          const createdAt = new Date().toISOString().slice(0, 10)
          const body = {
            caseCode,
            title: payload.title.trim() || `Case ${nextNumber}`,
            description: payload.description.trim() || 'New educational case created from the interface.',
            location: payload.location.trim() || 'Simulated scene',
            dimensions: { width: Number(payload.width) || 10, depth: Number(payload.depth) || 8 },
            createdAt,
            sceneState: { evidenceIds: [], selectedEvidenceId: null, hasImage: false },
          }
          const created = await api.createCase(body)
          const nextCases = [...get().cases, created]
          set({ cases: nextCases, selectedCaseId: created.id, activeCase: created.title, evidence: created.evidence ?? [], scenarios: created.scenarios ?? [], calculations: created.calculations ?? [] })
        } catch (err) {
          console.error('Create case failed', err)
          throw err
        } finally {
          set({ creatingCase: false })
        }
      },

      selectCase: async (caseId) => {
        try {
          const data = await api.getCase(caseId)
          set({ selectedCaseId: data.id, activeCase: data.title, activeSection: 'Case Info', currentModule: 'Case Info', evidence: data.evidence || [], scenarios: data.scenarios || [], activeScenarioId: data.scenarios?.[0]?.id ?? '', calculations: data.calculations || [], sceneState: data.sceneState || { evidenceIds: [], selectedEvidenceId: null, hasImage: false }, reconstructionGenerated: data.reconstructionGenerated ?? false, summaryGenerated: data.summaryGenerated ?? false, analysisResults: (data.calculations || []).map((c: any) => ({ id: c.id, name: c.title, result: c.result })) })
        } catch (err) {
          console.error('Select case failed', err)
        }
      },

      deleteCase: async (caseId) => {
        set({ deletingCase: true })
        try {
          await api.deleteCase(caseId)
          const remaining = get().cases.filter((c) => c.id !== caseId)
          if (remaining.length === 0) {
            set({ cases: [], selectedCaseId: '', activeCase: 'No Case Selected', evidence: [], scenarios: [], calculations: [], sceneState: { evidenceIds: [], selectedEvidenceId: null, hasImage: false }, analysisResults: [] })
          } else {
            const next = remaining[0]
            set({ cases: remaining })
            await get().selectCase(next.id)
          }
        } catch (err) {
          console.error('Delete case failed', err)
          throw err
        } finally {
          set({ deletingCase: false })
        }
      },

      addEvidence: async (item) => {
        const caseId = get().selectedCaseId
        if (!caseId) throw new Error('No selected case')
        try {
          const created = await api.createEvidence(caseId, item)
          // refresh case
          await get().selectCase(caseId)
        } catch (err) {
          console.error('Add evidence failed', err)
          throw err
        }
      },

      updateEvidence: async (id, item) => {
        const caseId = get().selectedCaseId
        if (!caseId) throw new Error('No selected case')
        try {
          await api.updateEvidence(caseId, id, item)
          await get().selectCase(caseId)
        } catch (err) {
          console.error('Update evidence failed', err)
          throw err
        }
      },

      removeEvidence: async (id) => {
        const caseId = get().selectedCaseId
        if (!caseId) throw new Error('No selected case')
        try {
          await api.deleteEvidence(caseId, id)
          await get().selectCase(caseId)
        } catch (err) {
          console.error('Remove evidence failed', err)
          throw err
        }
      },

      addScenario: async (item) => {
        const caseId = get().selectedCaseId
        if (!caseId) throw new Error('No selected case')
        try {
          await api.createScenario(caseId, item)
          await get().selectCase(caseId)
        } catch (err) {
          console.error('Add scenario failed', err)
          throw err
        }
      },

      setActiveScenario: (id) => set({ activeScenarioId: id }),

      setSceneState: (statePatch) =>
        set((current) => {
          const next = { ...current.sceneState, ...statePatch }
          return { sceneState: next }
        }),

      runAnalysis: async () => {
        const caseId = get().selectedCaseId
        if (!caseId) return
        set({ analysisState: { ...get().analysisState, isRunning: true, status: 'running' } })
        try {
          const calculations = await api.runAnalysis(caseId)
          set({ calculations, analysisResults: calculations.map((c: any) => ({ id: c.id, name: c.title, result: c.result })), analysisState: { isRunning: false, status: 'complete', completedCount: calculations.length, totalCount: calculations.length, progressItems: calculations.map((c: any) => ({ id: c.id, label: c.id, status: 'complete' })), lastRunAt: new Date().toISOString() } })
        } catch (err) {
          console.error('Run analysis failed', err)
          set({ analysisState: { isRunning: false, status: 'idle', completedCount: 0, totalCount: 0, progressItems: [], lastRunAt: null } })
          throw err
        }
      },

      generateReconstruction: async () => {
        const caseId = get().selectedCaseId
        if (!caseId) return
        await api.reconstruction(caseId)
        set({ reconstructionGenerated: true })
      },

      generateSummary: async () => {
        const caseId = get().selectedCaseId
        if (!caseId) return
        try {
          const res = await api.summary(caseId)
          set({ summaryGenerated: true, summaryText: res.summary ?? '' })
        } catch (err) {
          console.error('Generate summary failed', err)
          throw err
        }
      },
      explainScenario: async (scenarioId: string) => {
        const caseId = get().selectedCaseId
        if (!caseId) throw new Error('No selected case')
        try {
          await api.explainScenario(caseId, scenarioId)
          // refresh case to pick up explanation text
          await get().selectCase(caseId)
        } catch (err) {
          console.error('Explain scenario failed', err)
          throw err
        }
      },
      evaluateScenario: async (scenarioId: string) => {
        const caseId = get().selectedCaseId
        if (!caseId) throw new Error('No selected case')
        try {
          await api.evaluateScenario(caseId, scenarioId)
          await get().selectCase(caseId)
        } catch (err) {
          console.error('Evaluate scenario failed', err)
          throw err
        }
      },
      evaluateAllScenarios: async () => {
        const caseId = get().selectedCaseId
        if (!caseId) throw new Error('No selected case')
        try {
          await api.evaluateAllScenarios(caseId)
          await get().selectCase(caseId)
        } catch (err) {
          console.error('Evaluate all scenarios failed', err)
          throw err
        }
      },
      generateScenarioInsights: async (scenarioId: string) => {
        const caseId = get().selectedCaseId
        if (!caseId) throw new Error('No selected case')
        try {
          await api.generateScenarioInsights(caseId, scenarioId)
          await get().selectCase(caseId)
        } catch (err) {
          console.error('Generate insights failed', err)
          throw err
        }
      },
      autoGenerateScenarios: async () => {
        const caseId = get().selectedCaseId
        if (!caseId) return
        try {
          const created = await api.autoGenerateScenarios(caseId)
          // refresh scenarios from case
          await get().selectCase(caseId)
          return created
        } catch (err) {
          console.error('Auto-generate scenarios failed', err)
          throw err
        }
      },
    }),
    {
      name: 'forsimath-investigation-state',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ theme: state.theme }),
    },
  ),
)

// initialize load
useInvestigationStore.getState().init()
