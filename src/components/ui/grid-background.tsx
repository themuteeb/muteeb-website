import { cn } from '../../lib/utils';

/**
 * Aceternity UI — GridBackground
 * A subtle blueprint grid with a radial fade and an optional accent glow.
 * https://ui.aceternity.com/components/grid-background
 */
export const GridBackground = ({
  className,
  cellSize = 44,
  lineColor = 'rgba(255, 255, 255, 0.05)',
  glow = true,
  maskFrom = 'top',
}: {
  className?: string;
  cellSize?: number;
  lineColor?: string;
  glow?: boolean;
  maskFrom?: 'top' | 'center' | 'none';
}) => {
  const mask =
    maskFrom === 'top'
      ? 'radial-gradient(ellipse 90% 70% at 50% 0%, black 35%, transparent 100%)'
      : maskFrom === 'center'
        ? 'radial-gradient(ellipse 70% 60% at 50% 50%, black 30%, transparent 100%)'
        : 'none';

  return (
    <div
      aria-hidden
      className={cn(
        'pointer-events-none absolute inset-0 overflow-hidden',
        className
      )}
    >
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(to right, ${lineColor} 1px, transparent 1px), linear-gradient(to bottom, ${lineColor} 1px, transparent 1px)`,
          backgroundSize: `${cellSize}px ${cellSize}px`,
          maskImage: mask,
          WebkitMaskImage: mask,
        }}
      />
      {glow && (
        <div className="absolute -top-48 left-1/2 h-[480px] w-[720px] -translate-x-1/2 rounded-full bg-accent/[0.07] blur-[130px]" />
      )}
    </div>
  );
};
