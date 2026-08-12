import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

const TICKS = Array.from({ length: 12 }, (_, i) => i)

export default function ForensicLoader() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const start = Date.now()
    const duration = 2500

    const frame = () => {
      const elapsed = Date.now() - start
      const next = Math.min(100, (elapsed / duration) * 100)
      setProgress(next)
      if (next < 100) {
        requestAnimationFrame(frame)
      }
    }

    const id = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(id)
  }, [])

  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden px-4">
      <div className="absolute inset-0 forensic-grid-bg" />

      <motion.div
        className="absolute inset-x-0 top-1/2 h-px bg-forensic-amber/30"
        animate={{ opacity: [0.2, 0.6, 0.2] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      />

      <motion.div
        className="absolute inset-y-0 left-1/2 w-px bg-forensic-amber/20"
        animate={{ opacity: [0.1, 0.4, 0.1] }}
        transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
      />

      <motion.div
        className="absolute h-32 w-full max-w-md border border-forensic-amber/20"
        initial={{ scaleX: 0.3, opacity: 0 }}
        animate={{ scaleX: 1, opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <motion.div
          className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-forensic-amber to-transparent"
          animate={{ top: ['0%', '100%', '0%'] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        />
      </motion.div>

      <div className="relative z-10 w-full max-w-lg">
        <motion.p
          className="mb-8 text-center font-[family-name:var(--font-mono)] text-xs tracking-[0.25em] text-forensic-amber uppercase sm:text-sm"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.2, repeat: Infinity }}
        >
          Initializing Analysis Engine...
        </motion.p>

        <div className="relative mb-6 h-1.5 overflow-hidden border border-forensic-border bg-forensic-panel">
          <motion.div
            className="h-full bg-gradient-to-r from-forensic-amber-dim to-forensic-amber"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="mb-4 flex justify-between font-[family-name:var(--font-mono)] text-[10px] text-forensic-muted">
          {TICKS.map((tick) => (
            <motion.span
              key={tick}
              animate={{ opacity: progress > tick * 8 ? 1 : 0.3 }}
              transition={{ duration: 0.2 }}
            >
              {String(tick * 10).padStart(3, '0')}
            </motion.span>
          ))}
        </div>

        <div className="grid grid-cols-6 gap-1">
          {Array.from({ length: 18 }).map((_, i) => (
            <motion.div
              key={i}
              className="h-2 border border-forensic-border/50 bg-forensic-surface"
              initial={{ opacity: 0.2 }}
              animate={{
                opacity: progress > (i / 18) * 100 ? [0.4, 0.8, 0.4] : 0.2,
                backgroundColor:
                  progress > (i / 18) * 100
                    ? 'rgba(245, 158, 11, 0.15)'
                    : 'rgba(26, 35, 50, 1)',
              }}
              transition={{
                opacity: { duration: 0.8, repeat: Infinity, delay: i * 0.05 },
              }}
            />
          ))}
        </div>

        <p className="mt-6 text-center font-[family-name:var(--font-mono)] text-[10px] tracking-widest text-forensic-muted uppercase">
          Scanning coordinate matrix — {Math.round(progress)}%
        </p>
      </div>
    </div>
  )
}
