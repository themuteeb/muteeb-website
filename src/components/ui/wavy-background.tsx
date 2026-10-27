import type { CSSProperties } from 'react';

const WAVES = [
  'M-80 212 C 120 112, 310 338, 520 228 S 890 102, 1110 226 S 1390 346, 1530 196',
  'M-80 286 C 145 186, 315 400, 545 296 S 884 170, 1110 294 S 1384 407, 1530 262',
  'M-80 360 C 145 258, 330 478, 548 366 S 890 248, 1110 362 S 1380 486, 1530 332',
  'M-80 430 C 150 330, 320 544, 548 438 S 892 316, 1110 432 S 1380 550, 1530 402',
  'M-80 500 C 160 400, 330 612, 548 508 S 894 388, 1110 502 S 1380 620, 1530 474',
  'M-80 570 C 160 468, 338 680, 548 578 S 894 456, 1110 572 S 1380 690, 1530 544',
];

/** Soft, animated SVG wave lines for the light-theme hero background. */
export function WavyBackground({ className = '' }: { className?: string }) {
  return (
    <div aria-hidden="true" className={className}>
      <svg
        className="h-full w-full"
        viewBox="0 0 1440 760"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
      >
        <defs>
          <linearGradient id="hero-wave-gradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0" />
            <stop offset="24%" stopColor="var(--color-accent)" stopOpacity="0.52" />
            <stop offset="72%" stopColor="var(--color-accent-bright)" stopOpacity="0.36" />
            <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {WAVES.map((path, index) => {
          const style = { '--wave-delay': `${index * -1.1}s` } as CSSProperties;
          return (
            <path
              key={path}
              d={path}
              stroke="url(#hero-wave-gradient)"
              strokeWidth={index % 2 === 0 ? 1.2 : 0.8}
              strokeLinecap="round"
              className="hero-wave-line"
              style={style}
            />
          );
        })}
      </svg>
    </div>
  );
}
