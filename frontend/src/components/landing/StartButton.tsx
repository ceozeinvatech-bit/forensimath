import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

export default function StartButton() {
  const navigate = useNavigate()

  return (
    <motion.button
      type="button"
      onClick={() => navigate('/loading')}
      className="group relative cursor-pointer overflow-hidden rounded-full border border-forensic-amber/60 bg-forensic-amber-glow px-8 py-4 font-[family-name:var(--font-mono)] text-sm tracking-[0.24em] text-forensic-amber uppercase shadow-[0_16px_45px_rgba(247,184,74,0.16)] transition-all duration-300 hover:border-forensic-amber hover:bg-forensic-amber/20 sm:px-12 sm:py-5 sm:text-base"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 1.1 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <span className="relative z-10">[ START INVESTIGATION ]</span>
      <motion.span
        className="absolute inset-0 bg-gradient-to-r from-forensic-amber/0 via-forensic-amber/15 to-forensic-amber/0"
        initial={{ opacity: 0, x: '-100%' }}
        whileHover={{ opacity: 1, x: '100%' }}
        transition={{ duration: 0.45 }}
      />
    </motion.button>
  )
}
