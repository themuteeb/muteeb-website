import { motion } from 'framer-motion'

const breaks = ['1', '10', '25', '100', '1,000', '10,000']

export default function Production() {
  return (
    <section className="border-t border-border">
      <div className="container-k py-20 lg:py-22">
        <p className="eyebrow">07 · Prototype → Production</p>
        <h2 className="mt-4 text-[30px] font-semibold leading-tight tracking-[-0.01em] md:text-[40px]">
          Batch size changes the price, not the part
        </h2>

        <div className="mt-8 grid gap-10 lg:grid-cols-2 lg:gap-14">
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.5 }}
            className="max-w-[60ch] text-muted-foreground"
          >
            One-off prototypes through to batches of ten thousand. Below about twenty parts you are
            paying mostly for setup, which is why quantity break pricing matters so much at the low
            end. We will always show you what the next break costs, because ordering forty when you
            asked for twenty-five is sometimes cheaper in absolute terms.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.5, delay: 0.08 }}
            className="self-start border border-border bg-card p-5 md:p-6"
          >
            <div className="flex items-end justify-between">
              {breaks.map((b, i) => (
                <div key={b} className="flex flex-col items-center gap-2">
                  <span
                    aria-hidden="true"
                    className={`w-px ${i < 2 ? 'h-4 bg-spec' : 'h-4 bg-primary/70'}`}
                  />
                  <span className="font-mono text-[10px] tracking-[0.08em] text-muted-foreground md:text-[11px]">
                    {b}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 h-px w-full bg-gradient-to-r from-spec/80 via-primary/60 to-primary/20" />
            <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
              Quantity breaks shown on every quote · setup dominates below ~20 parts
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
