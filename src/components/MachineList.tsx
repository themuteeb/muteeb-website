import { motion } from 'framer-motion'

type Machine = {
  type: string
  name: string
  config: string
  envelope: string
}

const machines: Machine[] = [
  { type: 'MILL', name: 'Hermle C42U', config: '5-axis', envelope: '800 × 800 × 550' },
  { type: 'MILL', name: 'Hermle C32U', config: '5-axis', envelope: '650 × 600 × 500' },
  { type: 'MILL', name: 'DMG Mori DMU 50', config: '5-axis', envelope: '500 × 450 × 400' },
  { type: 'MILL', name: 'Haas VF-4SS', config: '3-axis', envelope: '1270 × 508 × 635' },
  { type: 'MILL', name: 'Haas VF-3', config: '3-axis', envelope: '1016 × 508 × 635' },
  { type: 'MILL', name: 'Haas VF-2', config: '3-axis', envelope: '762 × 406 × 508' },
  { type: 'MILL', name: 'Matsuura MX-520', config: '5-axis', envelope: '520 × 460 × 400' },
  { type: 'TURN', name: 'DMG Mori NLX 2500', config: 'Live tooling · sub-spindle', envelope: 'Ø366 × 705' },
  { type: 'TURN', name: 'Doosan Puma 2600SY', config: 'Y-axis · sub-spindle', envelope: 'Ø350 × 900' },
  { type: 'TURN', name: 'Haas ST-20', config: 'Turning', envelope: 'Ø356 × 559' },
  { type: 'EDM', name: 'Sodick AQ400LS', config: 'Wire', envelope: '400 × 300 × 250' },
  { type: 'GRIND', name: 'Jones & Shipman 1400', config: 'Surface', envelope: '600 × 300 table' },
  { type: 'LASER', name: 'Trumpf TruLaser 3030', config: 'Fibre · sheet', envelope: '12 mm mild steel' },
  { type: 'BRAKE', name: 'Amada HFE 1303', config: '130 tonne', envelope: '3 m sheet' },
]

export default function MachineList() {
  return (
    <section id="machines" className="scroll-mt-[70px] border-t border-border">
      <div className="container-k py-20 lg:py-22">
        <p className="eyebrow">08 · Machine List</p>
        <h2 className="mt-4 text-[30px] font-semibold leading-tight tracking-[-0.01em] md:text-[40px]">
          Fourteen machines, listed honestly
        </h2>
        <p className="mt-3 max-w-[64ch] text-muted-foreground">
          Nothing sells a machine shop like the machine list.
        </p>

        {/* Desktop: plain monospace table */}
        <div className="mt-10 hidden border border-border bg-card md:block">
          <table className="w-full border-collapse font-mono text-[12.5px]">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="w-[84px] px-4 py-3.5 font-medium uppercase tracking-[0.12em] text-muted-foreground">
                  Type
                </th>
                <th className="px-4 py-3.5 font-medium uppercase tracking-[0.12em] text-muted-foreground">
                  Machine
                </th>
                <th className="px-4 py-3.5 font-medium uppercase tracking-[0.12em] text-muted-foreground">
                  Config
                </th>
                <th className="px-4 py-3.5 text-right font-medium uppercase tracking-[0.12em] text-muted-foreground">
                  Envelope
                </th>
              </tr>
            </thead>
            <tbody>
              {machines.map((m, i) => (
                <motion.tr
                  key={m.name}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true, margin: '-20px' }}
                  transition={{ duration: 0.35, delay: i * 0.03 }}
                  className="border-b border-border/60 transition-colors last:border-0 hover:bg-card-elevated/60"
                >
                  <td className="px-4 py-3 uppercase tracking-[0.1em] text-primary/80">{m.type}</td>
                  <td className="px-4 py-3 text-foreground">{m.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{m.config}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{m.envelope}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile: stacked cards */}
        <ul className="mt-8 space-y-3 md:hidden">
          {machines.map((m, i) => (
            <motion.li
              key={m.name}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-20px' }}
              transition={{ duration: 0.35, delay: (i % 4) * 0.03 }}
              className="border border-border bg-card p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="border border-primary/40 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-primary">
                  {m.type}
                </span>
                <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
                  {m.envelope}
                </span>
              </div>
              <p className="mt-2.5 text-[15px] font-semibold font-sans">{m.name}</p>
              <p className="mt-0.5 font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
                {m.config}
              </p>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  )
}
