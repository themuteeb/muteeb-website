import { motion } from 'framer-motion'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@radix-ui/react-accordion'
import { ChevronDown } from 'lucide-react'
import { cn } from '../lib/utils'

const materials = ['Aluminium', 'Stainless', 'Tool steel', 'Titanium', 'Brass', 'Engineering plastics'] as const

type Cell = { level: 0 | 1 | 2; tol: string }
type Material = (typeof materials)[number]
type Row = { name: string; cells: Record<Material, Cell> }

const std = (tol = '±0.005'): Cell => ({ level: 2, tol })
const req = (tol = '±0.010'): Cell => ({ level: 1, tol })
const na: Cell = { level: 0, tol: '—' }

const rows: Row[] = [
  {
    name: 'CNC milling',
    cells: {
      Aluminium: std(),
      Stainless: std(),
      'Tool steel': std(),
      Titanium: std(),
      Brass: std(),
      'Engineering plastics': req(),
    },
  },
  {
    name: 'CNC turning',
    cells: {
      Aluminium: std(),
      Stainless: std(),
      'Tool steel': std(),
      Titanium: std('±0.003'),
      Brass: std(),
      'Engineering plastics': req(),
    },
  },
  {
    name: 'Wire EDM',
    cells: {
      Aluminium: req('±0.005'),
      Stainless: std('±0.003'),
      'Tool steel': std('±0.003'),
      Titanium: std('±0.003'),
      Brass: std('±0.003'),
      'Engineering plastics': na,
    },
  },
  {
    name: 'Surface grinding',
    cells: {
      Aluminium: req('±0.002'),
      Stainless: std('±0.002'),
      'Tool steel': std('±0.002'),
      Titanium: std('±0.002'),
      Brass: req('±0.002'),
      'Engineering plastics': na,
    },
  },
  {
    name: 'Sheet fabrication',
    cells: {
      Aluminium: std('±0.100'),
      Stainless: std('±0.100'),
      'Tool steel': req('±0.100'),
      Titanium: req('±0.100'),
      Brass: std('±0.100'),
      'Engineering plastics': req('±0.100'),
    },
  },
]

function Dot({ level }: { level: 0 | 1 | 2 }) {
  if (level === 0) {
    return <span className="inline-block h-3 w-3" aria-label="Not offered" />
  }
  return (
    <span
      aria-label={level === 2 ? 'Standard capability' : 'Available on request'}
      className={cn(
        'inline-block h-3 w-3 rounded-full transition-transform duration-200 group-hover:scale-125',
        level === 2 && 'bg-primary',
        level === 1 && 'border-[1.5px] border-primary',
      )}
    />
  )
}

function CellNote({ cell }: { cell: Cell }) {
  if (cell.level === 0) return 'Not offered'
  return `${cell.tol} mm${cell.level === 1 ? ' · on request' : ''}`
}

export default function CapabilityMatrix() {
  return (
    <section id="capabilities" className="scroll-mt-[70px] border-t border-border">
      <div className="container-k py-20 lg:py-22">
        <p className="eyebrow">01 · Capability</p>
        <h2 className="mt-4 text-[30px] font-semibold leading-tight tracking-[-0.01em] md:text-[40px]">
          What we cut and what we cut it in
        </h2>

        {/* Desktop / tablet: dense matrix */}
        <div className="mt-10 hidden border border-border bg-card md:block">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-border">
                <th
                  scope="col"
                  className="w-[190px] px-5 py-4 font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground"
                >
                  Process
                </th>
                {materials.map((m) => (
                  <th
                    key={m}
                    scope="col"
                    className="h-24 px-3 pb-2 pt-4 text-center align-bottom font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground md:[writing-mode:vertical-rl] md:rotate-180 lg:h-auto lg:[writing-mode:horizontal-tb] lg:rotate-0 lg:pb-4"
                  >
                    {m}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, r) => (
                <motion.tr
                  key={row.name}
                  initial={{ opacity: 0, x: -12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.4, delay: r * 0.06 }}
                  className="border-b border-border/60 transition-colors last:border-0 hover:bg-card-elevated/60"
                >
                  <th
                    scope="row"
                    className="px-5 py-3.5 font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-foreground"
                  >
                    {row.name}
                  </th>
                  {materials.map((m) => {
                    const cell = row.cells[m]
                    return (
                      <td key={m} className="group relative px-3 py-3.5 text-center">
                        <span className="relative inline-flex h-9 w-9 items-center justify-center">
                          <Dot level={cell.level} />
                          <span
                            role="tooltip"
                            className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1.5 -translate-x-1/2 whitespace-nowrap border border-border bg-card-elevated px-2.5 py-1 font-mono text-[10px] tracking-[0.08em] text-foreground opacity-0 shadow-[0_8px_24px_hsl(215_25%_3%/0.6)] transition-opacity duration-150 group-hover:opacity-100"
                          >
                            {CellNote({ cell })}
                          </span>
                        </span>
                      </td>
                    )
                  })}
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="mt-4 hidden flex-wrap gap-x-6 gap-y-2 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground md:flex">
          <span className="flex items-center gap-2">
            <span aria-hidden="true" className="h-3 w-3 rounded-full bg-primary" />
            Filled dot = standard capability
          </span>
          <span className="flex items-center gap-2">
            <span aria-hidden="true" className="h-3 w-3 rounded-full border-[1.5px] border-primary" />
            Ring = available on request
          </span>
          <span className="flex items-center gap-2">
            <span aria-hidden="true" className="h-3 w-3 rounded-full" />
            Empty = not offered
          </span>
        </div>

        {/* Mobile: per-process accordion */}
        <Accordion type="multiple" className="mt-10 border-t border-border md:hidden">
          {rows.map((row, r) => (
            <motion.div
              key={row.name}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: '-20px' }}
              transition={{ duration: 0.4, delay: r * 0.05 }}
              className="border-b border-border"
            >
              <AccordionItem value={row.name}>
                <AccordionTrigger className="flex w-full items-center justify-between gap-3 py-4 text-left [&>svg]:shrink-0 [&>svg]:text-muted-foreground [&>svg]:transition-transform data-[state=open]:text-primary [&[data-state=open]>svg]:rotate-180 hover:text-foreground">
                  <span className="font-mono text-[11px] font-medium uppercase tracking-[0.12em]">{row.name}</span>
                  <ChevronDown size={16} />
                </AccordionTrigger>
                <AccordionContent className="acc-content pb-4">
                  <ul className="space-y-2.5">
                    {materials.map((m) => {
                      const cell = row.cells[m]
                      return (
                        <li key={m} className="flex items-center justify-between gap-3 text-sm">
                          <span className="flex items-center gap-2.5">
                            <span className="flex h-3 w-3 items-center justify-center">
                              <Dot level={cell.level} />
                            </span>
                            {m}
                          </span>
                          <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
                            {CellNote({ cell })}
                          </span>
                        </li>
                      )
                    })}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            </motion.div>
          ))}
        </Accordion>

        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground md:hidden">
          <span className="flex items-center gap-2">
            <span aria-hidden="true" className="h-3 w-3 rounded-full bg-primary" />
            Standard
          </span>
          <span className="flex items-center gap-2">
            <span aria-hidden="true" className="h-3 w-3 rounded-full border-[1.5px] border-primary" />
            On request
          </span>
          <span className="flex items-center gap-2">
            <span aria-hidden="true" className="h-3 w-3 rounded-full" />
            Not offered
          </span>
        </div>
      </div>
    </section>
  )
}
