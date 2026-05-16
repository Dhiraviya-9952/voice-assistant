import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const STATUS_LABELS = {
  idle:      'How can I help you?',
  listening: 'Listening…',
  thinking:  'Thinking…',
  speaking:  'Speaking…',
  disconnected: 'Connecting…',
};

export default function StatusLabel({ status }) {
  const label = STATUS_LABELS[status] ?? STATUS_LABELS.idle;

  return (
    <AnimatePresence mode="wait">
      <motion.p
        key={status}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 'clamp(18px, 3vw, 26px)',
          fontWeight: 300,
          color: 'rgba(240,244,255,0.75)',
          letterSpacing: '-0.01em',
          textAlign: 'center',
        }}
      >
        {status === 'thinking' ? (
          <span className="flex items-center justify-center gap-2">
            <span>{label}</span>
            <span className="flex gap-1 ml-1">
              {[0, 1, 2].map(i => (
                <span key={i} className="thinking-dot" style={{ animationDelay: `${i * 0.2}s` }} />
              ))}
            </span>
          </span>
        ) : label}
      </motion.p>
    </AnimatePresence>
  );
}
