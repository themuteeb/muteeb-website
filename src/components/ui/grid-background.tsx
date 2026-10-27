import { cn } from '../../lib/utils';

/**
 * Aceternity UI — GridBackground
 * A subtle blueprint grid with a radial fade.
 * https://ui.aceternity.com/components/grid-background
 */
export const GridBackground = ({
  className,
  cellSize = 44,
  lineColor = 'rgba(255, 255, 255, 0.05)',
  maskFrom = 'top',
}: {
  className?: string;
  cellSize?: number;
  lineColor?: string;
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
    </div>
  );
};
