import { motion } from 'framer-motion'

const chips = ['ISO 9001:2015', 'AS9100 Rev D', 'ITAR REGISTERED', 'UKAS CALIBRATED']

const EASE = [0.22, 1, 0.36, 1] as const

export default function Hero() {
  return (
    <section id="top" className="relative overflow-hidden">
      <div
        aria-hidden="true"
        className="absolute inset-0 [background-image:linear-gradient(to_right,hsl(215_12%_20%/0.35)_1px,transparent_1px),linear-gradient(to_bottom,hsl(215_12%_20%/0.35)_1px,transparent_1px)] [background-size:56px_56px] [mask-image:radial-gradient(ellipse_80%_70%_at_50%_30%,black,transparent)]"
      />

      <div className="container-k grid min-h-[84vh] items-center gap-10 pt-[70px] pb-12 lg:grid-cols-2 lg:gap-14">
        <div>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE, delay: 0.05 }}
            className="eyebrow"
          >
            Contract Manufacturing · Coventry · ISO 9001 &amp; AS9100 · Since 1994
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE, delay: 0.12 }}
            className="mt-5 text-[clamp(38px,5vw,72px)] font-bold leading-[1.04] tracking-[-0.025em]"
          >
            <span className="text-primary">Five microns,</span>
            <br />
            repeatably, at volume.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE, delay: 0.22 }}
            className="mt-6 max-w-[54ch] text-[17px] text-muted-foreground"
          >
            Precision CNC machining and fabrication for aerospace, medical and motorsport. Fourteen
            machines, in-house CMM inspection, and a quote back within twenty-four hours on standard
            enquiries.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE, delay: 0.32 }}
            className="mt-8 flex flex-wrap gap-3"
          >
            <a href="#quote" className="btn-primary">
              Request a Quote
            </a>
            <a href="#capabilities" className="btn-ghost">
              See Capabilities
            </a>
          </motion.div>

          <ul className="mt-9 flex flex-wrap gap-2.5">
            {chips.map((c, i) => (
              <motion.li
                key={c}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: EASE, delay: 0.55 + i * 0.06 }}
                className="flex items-center gap-2 border border-border bg-card px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground"
              >
                <span aria-hidden="true" className="h-1 w-1 bg-primary" />
                {c}
              </motion.li>
            ))}
          </ul>
        </div>

        <motion.div
          initial={{ clipPath: 'inset(0 100% 0 0)' }}
          animate={{ clipPath: 'inset(0 0% 0 0)' }}
          transition={{ duration: 0.9, ease: EASE, delay: 0.35 }}
          className="relative"
        >
          <div className="relative border border-border bg-card">
            <img
              src="/images/hero-machining.jpg"
              alt="Five-axis CNC machining centre mid-cut with coolant spray"
              className="h-72 w-full object-cover sm:h-96 lg:h-[520px]"
            />
            {['left-2 top-2', 'right-2 top-2', 'left-2 bottom-14', 'right-2 bottom-14'].map((pos) => (
              <span
                key={pos}
                aria-hidden="true"
                className={`pointer-events-none absolute ${pos} font-mono text-[11px] text-primary/60`}
              >
                +
              </span>
            ))}
            <div className="flex items-center justify-between gap-3 border-t border-border bg-background/90 px-4 py-3">
              <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                Hermle C42U · 5-axis simultaneous
              </span>
              <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.12em] text-primary">
                <span aria-hidden="true" className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
                In process
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
