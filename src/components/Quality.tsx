import { motion } from 'framer-motion'

const certs = [
  { label: 'ISO 9001:2015', value: 'Since 2003 · Cert 4482019' },
  { label: 'AS9100 Rev D', value: 'Since 2011 · Cert 4482020' },
  { label: 'ITAR', value: 'Registered' },
  { label: 'Last audit', value: 'March 2026 · No major NCs' },
]

const equipment = [
  { name: 'Zeiss Contura G2', spec: 'CMM · 700 × 1000 × 600 mm' },
  { name: 'Mitutoyo Crysta-Apex S574', spec: 'CMM · 500 × 300 mm' },
  { name: 'Keyence IM-8000', spec: 'Optical comparator · 8 MP' },
  { name: 'In-house labs', spec: 'Surface finish · Hardness testing' },
]

export default function Quality() {
  return (
    <section id="quality" className="scroll-mt-[70px] border-t border-border">
      <div className="container-k py-20 lg:py-22">
        <p className="eyebrow">04 · Quality</p>
        <h2 className="mt-4 max-w-[24ch] text-[30px] font-semibold leading-tight tracking-[-0.01em] md:text-[40px]">
          Inspection is not an afterthought here
        </h2>

        <div className="mt-10 grid gap-10 lg:grid-cols-2 lg:gap-14">
          <div>
            <p className="text-muted-foreground">
              ISO 9001:2015 since 2003, AS9100 Rev D since 2011, both last audited March 2026 with no
              major non-conformances. ITAR registered. All measurement equipment UKAS calibrated on a
              twelve-month cycle with certificates available per job.
            </p>

            <div className="mt-7 grid grid-cols-1 gap-px border border-border bg-border sm:grid-cols-2">
              {certs.map((c) => (
                <div key={c.label} className="bg-card p-4">
                  <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                    {c.label}
                  </p>
                  <p className="mt-1.5 text-sm font-semibold">{c.value}</p>
                </div>
              ))}
            </div>

            <blockquote className="mt-7 border-l-2 border-spec pl-4 text-[17px] leading-[1.6]">
              First Article Inspection Reports to AS9102 supplied as standard on all new part numbers,
              at no additional cost.{' '}
              <span className="font-semibold text-foreground">
                We do not charge for proving that we made it right.
              </span>
            </blockquote>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.5 }}
          >
            <h3 className="font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
              Inspection equipment
            </h3>
            <ul className="mt-4 border border-border bg-card">
              {equipment.map((e, i) => (
                <li
                  key={e.name}
                  className={`flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 px-5 py-4 ${
                    i < equipment.length - 1 ? 'border-b border-border/70' : ''
                  }`}
                >
                  <span className="text-[15px] font-semibold">{e.name}</span>
                  <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
                    {e.spec}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm text-muted-foreground">
              Full surface finish and hardness testing in house. Reports are available per job, on
              request, without a second quote.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
