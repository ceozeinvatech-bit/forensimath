import { motion } from 'framer-motion'

export default function DisclaimerFooter() {
  return (
    <motion.footer
      className="mx-auto max-w-2xl border border-forensic-border/60 bg-forensic-panel/80 px-4 py-3 text-center backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, delay: 1.4 }}
    >
      <p className="font-[family-name:var(--font-mono)] text-[10px] leading-relaxed tracking-wide text-forensic-muted uppercase sm:text-xs">
        Educational simulation only. Not for real criminal identification or legal
        proceedings.
      </p>
    </motion.footer>
  )
}
