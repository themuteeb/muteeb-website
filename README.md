# Kestrel Precision — Contract Manufacturing Website

Spec-driven single-page site for a fictional precision engineering shop: machined-steel grey, cold
cyan, monospace data. Sells tolerances, certifications and lead times to engineers.

## Stack

- React 19 + Vite 7 + TypeScript
- Tailwind CSS v4 (CSS-first `@theme` config in `src/index.css`)
- Framer Motion (scroll/count animations)
- Radix UI Accordion (mobile capability matrix)
- lucide-react, clsx + tailwind-merge

## Develop

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Structure

All page sections live in `src/components/`:

| Section               | Component             |
| --------------------- | --------------------- |
| Navbar (fixed, 70px)  | `Navbar.tsx`          |
| Hero (84vh split)     | `Hero.tsx`            |
| Capability matrix     | `CapabilityMatrix.tsx`|
| Tolerances & capacity | `Capacity.tsx`        |
| Processes (2×3)       | `Processes.tsx`       |
| Quality & cert        | `Quality.tsx`         |
| Sectors               | `Sectors.tsx`         |
| How to get a quote    | `HowToQuote.tsx`      |
| Prototype to production | `Production.tsx`    |
| Machine list          | `MachineList.tsx`     |
| Quote form            | `QuoteForm.tsx`       |
| Footer                | `Footer.tsx`          |
| Mobile sticky CTA     | `MobileQuoteBar.tsx`  |
