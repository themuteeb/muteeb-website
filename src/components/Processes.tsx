import { motion } from 'framer-motion'
import { Boxes, Disc3, Drill, Layers, Sheet, Zap, type LucideIcon } from 'lucide-react'

type Process = {
  icon: LucideIcon
  title: string
  spec: string
  body: string
}

const processes: Process[] = [
  {
    icon: Drill,
    title: 'CNC Milling',
    spec: '3, 4 & 5-axis · to 1200 × 600 × 500 mm',
    body: 'Simultaneous 5-axis on two machines for complex geometry in a single setup.',
  },
  {
    icon: Disc3,
    title: 'CNC Turning',
    spec: 'Ø350 mm · 900 mm between centres',
    body: 'Live tooling and sub-spindle for done-in-one parts.',
  },
  {
    icon: Zap,
    title: 'Wire EDM',
    spec: '400 × 300 × 250 mm · ±0.003 mm positional',
    body: 'For hardened tool steel and profiles milling cannot reach.',
  },
  {
    icon: Layers,
    title: 'Surface Grinding',
    spec: '600 × 300 mm table · Ra 0.2',
    body: 'For flatness and finish requirements beyond machining.',
  },
  {
    icon: Sheet,
    title: 'Sheet Fabrication',
    spec: 'Laser to 12 mm · brake to 3 m',
    body: 'TIG and MIG welding with coded welders.',
  },
  {
    icon: Boxes,
    title: 'Assembly and Sub-assembly',
    spec: 'To customer specification',
    body: 'Kitting, mechanical assembly, helicoil insertion, and packing to customer specification.',
  },
]

export default function Processes() {
  return (
    <section id="processes" className="scroll-mt-[70px] border-t border-border">
      <div className="container-k py-20 lg:py-22">
        <p className="eyebrow">03 · Processes</p>
        <h2 className="mt-4 text-[30px] font-semibold leading-tight tracking-[-0.01em] md:text-[40px]">
          Cut, turn, sink, grind, form, assemble
        </h2>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {processes.map((p, i) => (
            <motion.article
              key={p.title}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.45, delay: (i % 2) * 0.06 }}
              className="group border border-border bg-card p-6 transition-colors duration-300 hover:border-primary/60 md:p-7"
            >
              <div className="flex items-start justify-between gap-4">
                <p.icon aria-hidden="true" size={22} strokeWidth={1.75} className="text-primary" />
                <span className="font-mono text-[11px] tracking-[0.12em] text-muted-foreground">
                  {String(i + 1).padStart(2, '0')}
                </span>
              </div>
              <h3 className="mt-5 text-lg font-semibold md:text-xl">{p.title}</h3>
              <p className="mt-1.5 font-mono text-[11px] uppercase tracking-[0.1em] text-primary">
                {p.spec}
              </p>
              <p className="mt-3 text-[15px] text-muted-foreground">{p.body}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  )
}
