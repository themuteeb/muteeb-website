import { motion } from 'framer-motion';

/**
 * Aceternity UI — TextGenerateEffect
 * Words generate in from a blur, staggered as they enter the viewport.
 * https://ui.aceternity.com/components/text-generate-effect
 */
export const TextGenerateEffect = ({
  words,
  className,
  delay = 0,
  stagger = 0.08,
  once = true,
}: {
  words: string;
  className?: string;
  delay?: number;
  stagger?: number;
  once?: boolean;
}) => {
  const wordsArray = words.split(' ');

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin: '-60px' }}
      variants={{
        visible: {
          transition: { staggerChildren: stagger, delayChildren: delay },
        },
      }}
      className={className}
    >
      {wordsArray.map((word, idx) => (
        <motion.span
          key={word + idx}
          variants={{
            hidden: { opacity: 0, filter: 'blur(8px)' },
            visible: {
              opacity: 1,
              filter: 'blur(0px)',
              transition: { duration: 0.5, ease: 'easeOut' },
            },
          }}
          className="inline-block"
        >
          {word}
          {idx < wordsArray.length - 1 ? '\u00A0' : ''}
        </motion.span>
      ))}
    </motion.div>
  );
};
