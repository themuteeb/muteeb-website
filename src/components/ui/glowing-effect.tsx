import { useId } from 'react';
import { cn } from '../../lib/utils';

/**
 * Aceternity UI — GlowingEffect
 * A traveling light that runs along the border of its parent card.
 * Drop it inside any `relative` + `group` parent with `rounded-*` and it
 * traces the edge; the glow brightens on group-hover.
 * https://ui.aceternity.com/components/glowing-effect
 */
export const GlowingEffect = ({
  blur = 0,
  spread = 26,
  inactiveZone = 0.6,
  variant = 'default',
  glow = true,
  disabled = false,
  borderRadius = 20,
  className,
}: {
  /** extra gaussian blur applied to the halo layer */
  blur?: number;
  /** length of the traveling light, in path units (path is normalised to 100) */
  spread?: number;
  /** resting opacity of the effect (0–1) when the card is not hovered */
  inactiveZone?: number;
  variant?: 'default' | 'green';
  /** render the soft blurred halo layer */
  glow?: boolean;
  disabled?: boolean;
  /** corner radius of the parent card, used to trace the border */
  borderRadius?: number;
  className?: string;
}) => {
  const id = useId().replace(/[:]/g, '');

  if (disabled) return null;

  const color =
    variant === 'green'
      ? 'rgba(124, 245, 172, 1)'
      : 'rgba(34, 212, 114, 1)';
  const tailColor =
    variant === 'green'
      ? 'rgba(34, 212, 114, 0.9)'
      : 'rgba(34, 212, 114, 0.75)';

  return (
    <div
      aria-hidden
      className={cn(
        'pointer-events-none absolute inset-0 z-[2]',
        className
      )}
    >
      <svg
        className="absolute inset-0 h-full w-full overflow-visible"
        style={{ width: '100%', height: '100%' }}
      >
        <defs>
          <linearGradient
            id={`glow-grad-${id}`}
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="rgba(34,212,114,0)" />
            <stop offset="30%" stopColor={tailColor} />
            <stop offset="50%" stopColor={color} />
            <stop offset="70%" stopColor={tailColor} />
            <stop offset="100%" stopColor="rgba(34,212,114,0)" />
          </linearGradient>
          {glow && (
            <filter id={`glow-blur-${id}`} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation={blur || 4} />
            </filter>
          )}
        </defs>

        <g
          className="transition-opacity duration-500 group-hover:opacity-100 motion-reduce:opacity-60"
          style={{ opacity: inactiveZone }}
        >
          {/* soft halo layer */}
          {glow && (
            <rect
              x="0.75"
              y="0.75"
              rx={borderRadius}
              ry={borderRadius}
              pathLength={100}
              fill="none"
              stroke={`url(#glow-grad-${id})`}
              strokeWidth={2.5}
              strokeDasharray={`${spread} ${100 - spread}`}
              className="animate-glow-travel opacity-70 transition-opacity duration-500 group-hover:opacity-100"
              style={{
                width: 'calc(100% - 1.5px)',
                height: 'calc(100% - 1.5px)',
                filter: `url(#glow-blur-${id})`,
              }}
            />
          )}
          {/* crisp border light */}
          <rect
            x="0.75"
            y="0.75"
            rx={borderRadius}
            ry={borderRadius}
            pathLength={100}
            fill="none"
            stroke={`url(#glow-grad-${id})`}
            strokeWidth={1.4}
            strokeDasharray={`${spread} ${100 - spread}`}
            className="animate-glow-travel"
            style={{
              width: 'calc(100% - 1.5px)',
              height: 'calc(100% - 1.5px)',
            }}
          />
        </g>
      </svg>
    </div>
  );
};
