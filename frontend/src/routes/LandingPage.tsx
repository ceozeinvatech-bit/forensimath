import { motion } from 'framer-motion'
import HeroTitle from '../components/landing/HeroTitle'
import StartButton from '../components/landing/StartButton'
import DisclaimerFooter from '../components/landing/DisclaimerFooter'

export default function LandingPage() {
  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden px-4 py-8">
      <div className="absolute inset-0 forensic-grid-bg" />

      <motion.div
        className="absolute top-1/4 left-0 h-px w-full bg-gradient-to-r from-transparent via-forensic-amber/20 to-transparent"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 1.5, delay: 0.5 }}
      />

      <motion.div
        className="absolute right-8 bottom-1/4 h-24 w-px bg-forensic-amber/15"
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ duration: 1, delay: 0.8 }}
      />

      <div className="relative z-10 flex w-full max-w-4xl flex-col items-center gap-10 sm:gap-14">
        <HeroTitle />
        <StartButton />
        <DisclaimerFooter />
      </div>

      <div className="pointer-events-none absolute right-4 bottom-4 font-[family-name:var(--font-mono)] text-[10px] tracking-widest text-forensic-muted/40 uppercase">
        SYS::READY
      </div>
    </div>
  )
}
