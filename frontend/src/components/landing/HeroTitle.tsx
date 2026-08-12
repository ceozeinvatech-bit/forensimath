import { motion } from 'framer-motion'

export default function HeroTitle() {
  return (
    <div className="text-center">
      <motion.p
        className="mb-3 font-[family-name:var(--font-mono)] text-xs tracking-[0.35em] text-forensic-amber uppercase sm:text-sm"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        Forensic Mathematics Platform
      </motion.p>

      <motion.h1
        className="mb-4 text-5xl font-semibold tracking-[0.16em] text-forensic-text sm:text-6xl md:text-7xl lg:text-8xl"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.4 }}
      >
        <span className="text-forensic-amber">FOREN</span>SIMATH
      </motion.h1>

      <motion.p
        className="mb-2 font-[family-name:var(--font-mono)] text-sm tracking-widest text-forensic-muted uppercase sm:text-base"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.7 }}
      >
        Mathematical Intelligence for Evidence Analysis
      </motion.p>

      <motion.p
        className="text-base text-forensic-text/70 italic sm:text-lg"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.9 }}
      >
        Where Mathematics Meets the Evidence.
      </motion.p>
    </div>
  )
}
