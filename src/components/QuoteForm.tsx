import { useState, type FormEvent } from 'react'
import { motion } from 'framer-motion'
import { CircleCheck, FileUp } from 'lucide-react'

const materialOptions = [
  'Aluminium',
  'Stainless',
  'Tool steel',
  'Titanium',
  'Brass',
  'Engineering plastics',
  'Mixed / other',
]

export default function QuoteForm() {
  const [files, setFiles] = useState<string[]>([])
  const [submitted, setSubmitted] = useState<string | null>(null)

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitted(`KP-26-${String(Math.floor(1000 + Math.random() * 9000))}`)
  }

  const reset = () => {
    setSubmitted(null)
    setFiles([])
  }

  return (
    <section id="quote" className="scroll-mt-[70px] border-t border-border">
      <div className="container-k py-20 lg:py-22">
        <p className="eyebrow">09 · Quote</p>
        <h2 className="mt-4 text-[30px] font-semibold leading-tight tracking-[-0.01em] md:text-[40px]">
          Request a quote
        </h2>

        <div className="mt-10 grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:gap-14">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.5 }}
          >
            {submitted ? (
              <div className="border border-primary/40 bg-card p-8 md:p-10">
                <CircleCheck size={30} className="text-primary" />
                <p className="mt-5 font-mono text-[12px] uppercase tracking-[0.12em] text-primary">
                  Request logged · {submitted}
                </p>
                <p className="mt-3 max-w-[48ch] text-muted-foreground">
                  We come back within twenty-four hours on standard enquiries. If yours is the complex
                  kind, you will hear that early rather than late.
                </p>
                <button type="button" onClick={reset} className="btn-ghost mt-7">
                  Send another
                </button>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="company" className="field-label">
                    Company
                  </label>
                  <input id="company" name="company" type="text" className="field-input" required />
                </div>
                <div>
                  <label htmlFor="contact" className="field-label">
                    Contact
                  </label>
                  <input id="contact" name="contact" type="text" className="field-input" required />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="email" className="field-label">
                    Email
                  </label>
                  <input id="email" name="email" type="email" className="field-input" required />
                </div>
                <div>
                  <label htmlFor="part" className="field-label">
                    Part name or number
                  </label>
                  <input id="part" name="part" type="text" className="field-input" />
                </div>
                <div>
                  <label htmlFor="quantity" className="field-label">
                    Quantity
                  </label>
                  <input
                    id="quantity"
                    name="quantity"
                    type="number"
                    min={1}
                    placeholder="e.g. 25"
                    className="field-input tabular-nums"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="material" className="field-label">
                    Material
                  </label>
                  <select id="material" name="material" className="field-input" defaultValue="Aluminium">
                    {materialOptions.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="tolerance" className="field-label">
                    Critical tolerance
                  </label>
                  <input
                    id="tolerance"
                    name="tolerance"
                    type="text"
                    placeholder="e.g. ±0.005 mm"
                    className="field-input tabular-nums"
                  />
                </div>
                <div>
                  <label htmlFor="required" className="field-label">
                    Required date
                  </label>
                  <input id="required" name="required" type="date" className="field-input" />
                </div>
                <div className="sm:col-span-2">
                  <span className="field-label">Drawing upload</span>
                  <label className="flex cursor-pointer flex-wrap items-center justify-between gap-3 border border-dashed border-border bg-card px-4 py-5 transition-colors hover:border-primary/60">
                    <span className="min-w-0 flex-1 truncate font-mono text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
                      {files.length
                        ? files.slice(0, 2).join(' · ') + (files.length > 2 ? ` +${files.length - 2} more` : '')
                        : 'STEP · IGES · DXF · PDF · SLDPRPRT · F3D'}
                    </span>
                    <span className="flex items-center gap-2 text-sm font-semibold text-primary">
                      <FileUp size={15} />
                      Choose files
                    </span>
                    <input
                      type="file"
                      multiple
                      className="sr-only"
                      accept=".step,.stp,.iges,.igs,.dxf,.pdf,.sldprt,.sldasm,.f3d,.f3dz"
                      onChange={(e) => setFiles(Array.from(e.target.files ?? []).map((f) => f.name))}
                    />
                  </label>
                </div>
                <div className="sm:col-span-2">
                  <button type="submit" className="btn-primary w-full sm:w-auto">
                    Request a Quote
                  </button>
                  <p className="mt-4 max-w-[70ch] text-[13px] leading-relaxed text-muted-foreground">
                    Drawings are treated as confidential and covered by our standard NDA from the moment
                    they arrive. A signed mutual NDA is available on request before you send anything.
                  </p>
                </div>
              </form>
            )}
          </motion.div>

          <motion.aside
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.5, delay: 0.08 }}
            className="self-start border border-border bg-card p-6 md:p-7"
          >
            <h3 className="font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
              What to expect
            </h3>
            <dl className="mt-5 space-y-4 font-mono text-[12px]">
              <div className="flex items-baseline justify-between gap-4 border-b border-border/60 pb-4">
                <dt className="uppercase tracking-[0.1em] text-muted-foreground">Standard enquiry</dt>
                <dd className="tabular-nums text-primary">24 h</dd>
              </div>
              <div className="flex items-baseline justify-between gap-4 border-b border-border/60 pb-4">
                <dt className="uppercase tracking-[0.1em] text-muted-foreground">Complex multi-part</dt>
                <dd className="tabular-nums text-primary">48–72 h</dd>
              </div>
              <div className="flex items-baseline justify-between gap-4 border-b border-border/60 pb-4">
                <dt className="uppercase tracking-[0.1em] text-muted-foreground">FAIR (new part nos.)</dt>
                <dd className="tabular-nums text-primary">AS9102 · incl.</dd>
              </div>
              <div className="flex items-baseline justify-between gap-4">
                <dt className="uppercase tracking-[0.1em] text-muted-foreground">Phone</dt>
                <dd className="tabular-nums text-foreground">024 7655 0140</dd>
              </div>
            </dl>
            <p className="mt-6 text-[13px] leading-relaxed text-muted-foreground">
              Every quote shows quantity break pricing, the tolerance held, and the machine it will be
              run on. If we cannot hold the tolerance, we say so before you spend a penny.
            </p>
          </motion.aside>
        </div>
      </div>
    </section>
  )
}
