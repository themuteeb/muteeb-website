import { useEffect, useState } from 'react'

export default function MobileQuoteBar() {
  const [show, setShow] = useState(true)

  useEffect(() => {
    const el = document.getElementById('quote')
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => setShow(!entry.isIntersecting),
      { threshold: 0.12 },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  if (!show) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/90 p-3 backdrop-blur-md [padding-bottom:max(0.75rem,env(safe-area-inset-bottom))] md:hidden">
      <a href="#quote" className="btn-primary w-full">
        Request a Quote
      </a>
    </div>
  )
}
