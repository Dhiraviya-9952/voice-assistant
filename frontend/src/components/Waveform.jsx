import React from 'react';
import { motion } from 'framer-motion';

const BAR_COUNT = 20;

// Each bar gets a unique height range for an organic waveform feel
const BAR_CONFIGS = Array.from({ length: BAR_COUNT }, (_, i) => {
  const center = BAR_COUNT / 2;
  const distFromCenter = Math.abs(i - center) / center; // 0 (center) → 1 (edge)
  const maxH = Math.round(32 - distFromCenter * 18); // taller in center
  const minH = Math.round(4 + distFromCenter * 4);
  const delay = (i / BAR_COUNT) * 0.6;
  return { maxH, minH, delay };
});

export default function Waveform({ color = '#3b82f6', secondaryColor = '#06b6d4' }) {
  return (
    <div
      className="flex items-center justify-center gap-[3px]"
      style={{ height: 48 }}
      aria-label="Audio waveform"
    >
      {BAR_CONFIGS.map(({ maxH, minH, delay }, i) => {
        // Alternate between blue and cyan for gradient-like effect
        const barColor = i % 3 === 0 ? secondaryColor : color;
        return (
          <motion.div
            key={i}
            className="wave-bar"
            style={{
              width: 3,
              borderRadius: 4,
              background: barColor,
              boxShadow: `0 0 6px 1px ${barColor}55`,
              originY: 1,
            }}
            animate={{
              height: [minH, maxH, minH],
              opacity: [0.6, 1, 0.6],
            }}
            transition={{
              duration: 0.55 + Math.random() * 0.3,
              repeat: Infinity,
              delay,
              ease: 'easeInOut',
            }}
          />
        );
      })}
    </div>
  );
}
