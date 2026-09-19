import { motion } from 'framer-motion'
import { Clock, Package, Upload, type LucideIcon } from 'lucide-react'

type Step = {
  icon: LucideIcon
  title: string
  body: string
}

const steps: Step[] = [
  {
    icon: Upload,
    title: 'Send drawings',
    body: 'STEP, IGES, DXF, PDF or native SolidWorks and Fusion files. If all you have is a sketch and a sample, send that.',
  },
  {
    icon: Package,
    title: 'Tell us quantity and material',
    body: 'Price per part changes considerably between one and a hundred, and we will show you the break points rather than quoting one number.',
  },
  {
    icon: Clock,
    title: 'We come back within 24 hours',
    body: 'On standard enquiries. Complex multi-part assemblies take two to three days and we will tell you which yours is.',
  },
]

export default function HowToQuote() {
  return (
    <section className="border-t border-border">
      <div className="container-k py-20 lg:py-22">
        <p className="eyebrow">06 · Quotes</p>
        <h2 className="mt-4 text-[30px] font-semibold leading-tight tracking-[-0.01em] md:text-[40px]">
          How to get a quote
        </h2>

        <ol className="mt-10 grid gap-4 md:grid-cols-3">
          {steps.map((s, i) => (
            <motion.li
              key={s.title}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.45, delay: i * 0.06 }}
              className="border border-border bg-card p-6 transition-colors duration-300 hover:border-primary/60"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] tracking-[0.12em] text-primary">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <s.icon aria-hidden="true" size={20} strokeWidth={1.75} className="text-primary" />
              </div>
              <h3 className="mt-5 text-lg font-semibold">{s.title}</h3>
              <p className="mt-2.5 text-[15px] text-muted-foreground">{s.body}</p>
            </motion.li>
          ))}
        </ol>

        <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
          Standard enquiries · 24 h &nbsp;—&nbsp; Complex multi-part · 48–72 h
        </p>
      </div>
    </section>
  )
}
