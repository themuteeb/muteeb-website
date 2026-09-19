import { useEffect, useState } from 'react'
import { Menu, X } from 'lucide-react'
import { cn } from '../lib/utils'

const links = [
  { label: 'Capabilities', href: '#capabilities' },
  { label: 'Quality', href: '#quality' },
  { label: 'Sectors', href: '#sectors' },
  { label: 'Machines', href: '#machines' },
  { label: 'Quote', href: '#quote' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 h-[70px] border-b bg-background/80 backdrop-blur-md transition-colors duration-300',
        scrolled ? 'border-primary/40' : 'border-transparent',
      )}
    >
      <div className="container-k flex h-full items-center justify-between gap-4">
        <a
          href="#top"
          className="flex shrink-0 items-center gap-2.5"
          onClick={() => setOpen(false)}
          aria-label="Kestrel Precision — back to top"
        >
          <svg width="20" height="20" viewBox="0 0 64 64" aria-hidden="true">
            <path d="M20 12v40M20 34 42 14M28 26l18 26" stroke="hsl(190 90% 48%)" strokeWidth="6" fill="none" />
          </svg>
          <span className="text-[16px] font-bold tracking-tight">
            KESTREL <span className="font-semibold text-muted-foreground">PRECISION</span>
          </span>
        </a>

        <nav className="hidden items-center gap-7 lg:flex" aria-label="Primary">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground transition-colors hover:text-foreground"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <a
            href="#quote"
            className="hidden font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground transition-colors hover:text-primary md:block"
          >
            Upload drawings
          </a>
          <a
            href="#quote"
            className="hidden items-center bg-primary px-4 py-2.5 text-[13px] font-semibold text-primary-foreground transition-colors duration-200 hover:bg-[hsl(190_90%_56%)] sm:inline-flex"
          >
            Request a Quote
          </a>
          <button
            type="button"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            className="flex h-10 w-10 items-center justify-center border border-border text-foreground lg:hidden"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-b border-border bg-background/95 backdrop-blur-md lg:hidden">
          <nav className="container-k flex flex-col py-4" aria-label="Mobile">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="border-b border-border/60 py-3.5 font-mono text-[12px] uppercase tracking-[0.12em] text-foreground last:border-0"
              >
                {l.label}
              </a>
            ))}
            <a href="#quote" onClick={() => setOpen(false)} className="btn-primary mt-4 w-full">
              Request a Quote
            </a>
          </nav>
        </div>
      )}
    </header>
  )
}
