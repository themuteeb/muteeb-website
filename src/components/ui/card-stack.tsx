import React, { useEffect, useMemo, useRef, useState } from 'react';
import { animate, motion, useDragControls, useMotionValue } from 'framer-motion';
import { cn } from '../../lib/utils';

export interface CardStackItem {
  id: string | number;
}

/**
 * Aceternity UI — CardStack
 * A swipeable stack of cards: drag (or tap) the front card to send it to
 * the back of the stack.
 * https://ui.aceternity.com/components/card-stack
 */
export function CardStack<T extends CardStackItem>({
  items,
  offset = 10,
  scaleFactor = 0.05,
  className,
  cardClassName,
  renderCard,
}: {
  items: T[];
  /** vertical peek distance between stacked cards, in px */
  offset?: number;
  /** how much each card shrinks per stack level */
  scaleFactor?: number;
  className?: string;
  cardClassName?: string;
  renderCard: (item: T, isTop: boolean) => React.ReactNode;
}) {
  const [order, setOrder] = useState<Array<string | number>>(() =>
    items.map((i) => i.id)
  );

  const itemsKey = useMemo(() => items.map((i) => i.id).join('|'), [items]);

  useEffect(() => {
    setOrder(items.map((i) => i.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemsKey]);

  const sendToBack = (id: string | number) => {
    setOrder((prev) => {
      if (!prev.includes(id)) return prev;
      return [...prev.filter((i) => i !== id), id];
    });
  };

  return (
    <div className={cn('relative', className)}>
      {order.map((id, index) => {
        const item = items.find((i) => i.id === id);
        if (!item) return null;
        return (
          <StackCard
            key={id}
            index={index}
            offset={offset}
            scaleFactor={scaleFactor}
            onSendToBack={() => sendToBack(id)}
            className={cardClassName}
          >
            {renderCard(item, index === 0)}
          </StackCard>
        );
      })}
    </div>
  );
}

function StackCard({
  index,
  offset,
  scaleFactor,
  onSendToBack,
  className,
  children,
}: {
  index: number;
  offset: number;
  scaleFactor: number;
  onSendToBack: () => void;
  className?: string;
  children: React.ReactNode;
}) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useMotionValue(0);
  const scale = useMotionValue(1);
  const dragControls = useDragControls();
  const isTop = index === 0;

  const pointerStart = useRef<{ x: number; y: number; t: number } | null>(
    null
  );

  useEffect(() => {
    const spring = { type: 'spring' as const, stiffness: 260, damping: 26 };
    if (isTop) {
      animate(x, 0, spring);
      animate(y, 0, spring);
      animate(rotate, 0, spring);
      animate(scale, 1, spring);
    } else {
      animate(x, index * offset * 0.45, spring);
      animate(y, -index * offset * 0.95, spring);
      animate(rotate, (index % 2 === 0 ? -1 : 1) * Math.min(index, 3) * 0.5, spring);
      animate(scale, 1 - index * scaleFactor, spring);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTop, index, offset, scaleFactor]);

  const handleDragEnd = (_: unknown, info: { offset: { x: number; y: number } }) => {
    const { x: ox, y: oy } = info.offset;
    if (Math.abs(ox) > 70 || Math.abs(oy) > 70) {
      const exitX = ox >= 0 ? 460 : -460;
      const exitY = oy * 2.4;
      const exitR = ox >= 0 ? 18 : -18;
      animate(x, exitX, { duration: 0.28, ease: 'easeOut' });
      animate(y, exitY, { duration: 0.28, ease: 'easeOut' });
      animate(rotate, exitR, { duration: 0.28, ease: 'easeOut' });
      // reorder after the fly-out; the index effect springs the card
      // back into its new slot at the back of the stack
      setTimeout(() => onSendToBack(), 260);
    } else {
      animate(x, 0, { type: 'spring', stiffness: 320, damping: 26 });
      animate(y, 0, { type: 'spring', stiffness: 320, damping: 26 });
      animate(rotate, 0, { type: 'spring', stiffness: 320, damping: 26 });
    }
  };

  return (
    <motion.div
      style={{ x, y, rotate, scale, zIndex: 100 - index }}
      drag={isTop}
      dragListener={false}
      dragControls={dragControls}
      dragElastic={0.65}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      onDragEnd={handleDragEnd}
      whileTap={{ cursor: 'grabbing' }}
      onPointerDown={(e) => {
        // only start a card drag when the gesture begins on the card body,
        // never on interactive children (buttons / links) — their clicks
        // must go through untouched
        const target = e.target as HTMLElement;
        if (isTop && !target.closest('button, a, input, textarea, select')) {
          dragControls.start(e);
        }
        pointerStart.current = { x: e.clientX, y: e.clientY, t: Date.now() };
      }}
      onPointerUp={(e) => {
        const start = pointerStart.current;
        pointerStart.current = null;
        if (!start) return;
        const moved = Math.hypot(e.clientX - start.x, e.clientY - start.y);
        const onInteractiveChild = !!(e.target as HTMLElement).closest(
          'button, a, input, textarea, select'
        );
        if (!onInteractiveChild && moved < 6 && Date.now() - start.t < 400) {
          // treat as a tap on the card body — cycle this card to the back
          animate(x, 0, { duration: 0.18 });
          animate(y, -40, { duration: 0.18, ease: 'easeIn' });
          setTimeout(() => onSendToBack(), 170);
        }
      }}
      className={cn(
        'absolute inset-0 cursor-grab select-none',
        isTop ? 'shadow-2xl' : 'shadow-lg',
        className
      )}
    >
      {children}
    </motion.div>
  );
}
