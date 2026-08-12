import { useInvestigationStore } from '../../../store/investigationStore'
import SectionShell from './SectionShell'

export default function OpenCVSection() {
  const sceneState = useInvestigationStore((state) => state.sceneState)
  const setSceneState = useInvestigationStore((state) => state.setSceneState)

  return (
    <SectionShell
      title="OPENCV"
      subtitle="Optional image-analysis workspace"
      action={
        <button
          type="button"
          onClick={() => setSceneState({ hasImage: !sceneState.hasImage })}
          className="cursor-pointer border border-forensic-amber/50 bg-forensic-amber/10 px-3 py-2 font-[family-name:var(--font-mono)] text-[10px] tracking-[0.2em] text-forensic-amber uppercase transition-colors hover:border-forensic-amber hover:bg-forensic-amber/20"
        >
          {sceneState.hasImage ? 'Remove Image' : 'Upload Image'}
        </button>
      }
    >
      <div className="flex h-full min-h-[24rem] items-center justify-center rounded border border-dashed border-forensic-border bg-forensic-surface/30 p-6">
        {sceneState.hasImage ? (
          <div className="w-full text-center">
            <p className="text-lg font-semibold text-forensic-text">Image ready for optional analysis</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              This interface is prepared for future OpenCV processing. For now it simply demonstrates where image-based measurements would be attached.
            </p>
          </div>
        ) : (
          <div className="max-w-xl text-center">
            <p className="text-lg font-semibold text-forensic-text">No image uploaded</p>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              Upload an evidence image to enable optional image-based measurement analysis. This tool is educational and does not identify people or determine criminal responsibility.
            </p>
            <button
              type="button"
              onClick={() => setSceneState({ hasImage: true })}
              className="mt-4 cursor-pointer border border-forensic-amber/50 bg-forensic-amber/10 px-4 py-3 font-[family-name:var(--font-mono)] text-[10px] tracking-[0.2em] text-forensic-amber uppercase transition-colors hover:border-forensic-amber hover:bg-forensic-amber/20"
            >
              Upload Image
            </button>
          </div>
        )}
      </div>
    </SectionShell>
  )
}
