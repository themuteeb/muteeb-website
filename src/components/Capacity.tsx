import { useEffect, useRef, useState } from 'react'
import { useInView } from 'framer-motion'

type CountUpProps = {
  from?: number
  to: number
  duration?: number
  decimals?: number
  prefix?: string
  className?: string
}

function CountUp({ from = 0, to, duration = 1600, decimals = 0, prefix = '', className }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  const [value, setValue] = useState(from)

  useEffect(() => {
    if (!inView) return
    let raf = 0
    const t0 = performance.now()
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / duration)
      const eased = 1 - Math.pow(1 - p, 3)
      setValue(from + (to - from) * eased)
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [inView, from, to, duration])

  return (
    <span ref={ref} className={className}>
      {prefix}
      {value.toFixed(decimals)}
    </span>
  )
}

export default function Capacity() {
  return (
    <section className="border-t border-border">
      <div className="container-k py-20 lg:py-22">
        <p className="eyebrow">02 · Tolerances &amp; Capacity</p>
        <h2 className="mt-4 text-[30px] font-semibold leading-tight tracking-[-0.01em] md:text-[40px]">
          The shop in numbers
        </h2>

        <div className="mt-10 grid grid-cols-2 gap-px border border-border bg-border md:grid-cols-4">
          <div className="bg-background p-5 md:p-7">
            <div className="flex items-baseline gap-1.5">
              <CountUp
                from={0.1}
                to={0.005}
                duration={1600}
                decimals={3}
                prefix="±"
                className="text-[34px] font-bold tabular-nums tracking-tight text-spec md:text-[44px]"
              />
              <span className="text-sm font-semibold text-muted-foreground">mm</span>
            </div>
            <p className="mt-2.5 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
              Achievable tolerance
            </p>
          </div>

          <div className="bg-background p-5 md:p-7">
            <div className="flex flex-wrap items-baseline gap-x-1.5">
              <CountUp to={1200} duration={1600} className="text-[34px] font-bold tabular-nums tracking-tight md:text-[44px]" />
              <span className="text-sm font-semibold text-muted-foreground">× 600 × 500 mm</span>
            </div>
            <p className="mt-2.5 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
              Largest envelope
            </p>
          </div>

          <div className="bg-background p-5 md:p-7">
            <div className="flex items-baseline gap-1.5">
              <CountUp to={14} duration={1600} className="text-[34px] font-bold tabular-nums tracking-tight md:text-[44px]" />
              <span className="text-sm font-semibold text-muted-foreground">spindles</span>
            </div>
            <p className="mt-2.5 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
              CNC machines
            </p>
          </div>

          <div className="bg-background p-5 md:p-7">
            <div className="flex items-baseline gap-1.5">
              <CountUp to={9} duration={1600} className="text-[34px] font-bold tabular-nums tracking-tight md:text-[44px]" />
              <span className="text-sm font-semibold text-muted-foreground">days</span>
            </div>
            <p className="mt-2.5 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
              Typical lead time
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
