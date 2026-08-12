const NAV_ITEMS = [
  { label: 'Case Info', icon: '01' },
  { label: 'Evidence', icon: '02' },
  { label: 'Math Engine', icon: '03' },
  { label: 'OpenCV', icon: '04' },
  { label: 'Scenarios', icon: '05' },
  { label: '2D Scene', icon: '06' },
  { label: 'Timeline', icon: '07' },
  { label: 'Summary', icon: '08' },
] as const

type SidebarNavProps = {
  activeItem?: string
  onSelect?: (item: string) => void
  variant?: 'vertical' | 'horizontal'
}

export default function SidebarNav({
  activeItem = '',
  onSelect,
  variant = 'vertical',
}: SidebarNavProps) {
  if (variant === 'horizontal') {
    return (
      <nav className="flex gap-1 overflow-x-auto px-3 pb-1">
        {NAV_ITEMS.map((item) => {
          const isActive = activeItem === item.label
          return (
            <button
              key={item.label}
              type="button"
              onClick={() => onSelect?.(item.label)}
              className={`shrink-0 cursor-pointer rounded-full border px-3 py-1.5 text-[10px] font-semibold tracking-[0.2em] whitespace-nowrap transition-all duration-200 ${
                isActive
                  ? 'border-forensic-amber bg-forensic-amber/16 text-forensic-text shadow-[0_0_0_1px_rgba(247,184,74,0.2)]'
                  : 'border-forensic-border text-forensic-text/85 hover:border-forensic-accent/50 hover:bg-forensic-surface/70 hover:text-forensic-text'
              }`}
            >
              <span className="mr-2">{item.icon}</span>
              {item.label}
            </button>
          )
        })}
      </nav>
    )
  }

  return (
    <nav className="flex flex-col gap-0.5">
      <p className="mb-3 px-3 text-[10px] font-semibold tracking-[0.3em] text-forensic-muted uppercase">
        Investigation Modules
      </p>
      {NAV_ITEMS.map((item) => {
        const isActive = activeItem === item.label
        return (
          <button
            key={item.label}
            type="button"
            onClick={() => onSelect?.(item.label)}
            className={`flex items-center gap-2.5 rounded-r-xl border-l-2 px-3 py-2.5 text-left text-[11px] font-medium tracking-[0.2em] uppercase transition-all duration-200 sm:text-sm ${
              isActive
                ? 'border-forensic-amber bg-gradient-to-r from-forensic-amber/16 to-forensic-accent/12 text-forensic-text shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]'
                : 'border-transparent text-forensic-text/80 hover:border-forensic-border hover:bg-forensic-surface/70 hover:text-forensic-text'
            }`}
          >
            <span className="min-w-8 rounded-full border border-forensic-border/70 bg-white/5 px-1.5 py-0.5 text-center text-[10px] font-semibold text-forensic-amber">
              {item.icon}
            </span>
            <span>{item.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
