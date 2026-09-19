import { motion } from 'framer-motion'
import { Cog, Cross, Flag, Plane, type LucideIcon } from 'lucide-react'

type Sector = {
  icon: LucideIcon
  title: string
  body: string
}

const sectors: Sector[] = [
  {
    icon: Plane,
    title: 'Aerospace',
    body: 'AS9100 flowdown, full material traceability to mill certificate, and the documentation burden handled properly rather than reluctantly.',
  },
  {
    icon: Cross,
    title: 'Medical Devices',
    body: 'Cleanroom-compatible packing, validated processes, and change control that will survive an audit.',
  },
  {
    icon: Flag,
    title: 'Motorsport',
    body: 'Turnaround measured in days rather than weeks, because a part needed for Friday practice is needed for Friday practice.',
  },
  {
    icon: Cog,
    title: 'Industrial Automation',
    body: 'Repeat batch work with call-off scheduling and consigned stock holding.',
  },
]

export default function Sectors() {
  return (
    <section id="sectors" className="scroll-mt-[70px] border-t border-border">
      <div className="container-k py-20 lg:py-22">
        <p className="eyebrow">05 · Sectors</p>
        <h2 className="mt-4 text-[30px] font-semibold leading-tight tracking-[-0.01em] md:text-[40px]">
          Who we build for
        </h2>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {sectors.map((s, i) => (
            <motion.article
              key={s.title}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.45, delay: (i % 2) * 0.06 }}
              className="group border border-border bg-card p-6 transition-colors duration-300 hover:border-primary/60 md:p-7"
            >
              <s.icon aria-hidden="true" size={22} strokeWidth={1.75} className="text-primary" />
              <h3 className="mt-5 text-lg font-semibold md:text-xl">{s.title}</h3>
              <p className="mt-3 text-[15px] text-muted-foreground">{s.body}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  )
}
