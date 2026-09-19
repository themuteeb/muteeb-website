const nav = [
  { label: 'Capabilities', href: '#capabilities' },
  { label: 'Quality', href: '#quality' },
  { label: 'Sectors', href: '#sectors' },
  { label: 'Machines', href: '#machines' },
  { label: 'Quote', href: '#quote' },
]

export default function Footer() {
  return (
    <footer className="border-t border-primary/30 bg-footer pt-14 pb-28 md:pb-14">
      <div className="container-k">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2.5">
              <svg width="18" height="18" viewBox="0 0 64 64" aria-hidden="true">
                <path d="M20 12v40M20 34 42 14M28 26l18 26" stroke="hsl(190 90% 48%)" strokeWidth="6" fill="none" />
              </svg>
              <span className="text-[15px] font-bold tracking-tight">
                KESTREL <span className="font-semibold text-muted-foreground">PRECISION</span>
              </span>
            </div>
            <p className="mt-4 max-w-[28ch] text-sm text-muted-foreground">
              Five microns, repeatably, at volume.
            </p>
            <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
              Contract manufacturing · Coventry · Since 1994
            </p>
          </div>

          <div>
            <h3 className="font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
              Contact
            </h3>
            <address className="mt-4 space-y-1.5 text-sm not-italic text-foreground">
              <p>Unit 7, Bayton Road Industrial Estate</p>
              <p>Coventry CV7 9EJ</p>
              <p className="pt-2 font-mono text-[12px] tabular-nums">024 7655 0140</p>
            </address>
          </div>

          <div>
            <h3 className="font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
              Certification
            </h3>
            <ul className="mt-4 space-y-1.5 font-mono text-[11px] tracking-[0.05em] text-muted-foreground">
              <li>ISO 9001:2015 · Cert 4482019</li>
              <li>AS9100 Rev D · Cert 4482020</li>
              <li>ITAR registered</li>
              <li>UKAS calibrated</li>
            </ul>
          </div>

          <div>
            <h3 className="font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
              Navigate
            </h3>
            <ul className="mt-4 space-y-2">
              {nav.map((l) => (
                <li key={l.href}>
                  <a href={l.href} className="text-sm text-muted-foreground transition-colors hover:text-primary">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-border/60 pt-6 md:flex-row md:items-center md:justify-between">
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
            © 2026 Kestrel Precision Ltd · Company registration 02918844
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-primary/70">
            Five microns, repeatably, at volume.
          </span>
        </div>
      </div>
    </footer>
  )
}
