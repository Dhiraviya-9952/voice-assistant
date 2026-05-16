import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Volume2, Cpu, Wifi, WifiOff } from 'lucide-react';

const STATUS_META = {
  idle:         { label: 'Ready', color: '#10b981', Icon: Mic,     desc: 'Listening for you…' },
  listening:    { label: 'Listening', color: '#06b6d4', Icon: Mic,     desc: 'Speak now…' },
  thinking:     { label: 'Thinking', color: '#8b5cf6', Icon: Cpu,     desc: 'Processing your request…' },
  speaking:     { label: 'Speaking', color: '#3b82f6', Icon: Volume2, desc: 'Playing response…' },
  disconnected: { label: 'Offline',  color: '#ef4444', Icon: WifiOff, desc: 'Reconnecting…' },
};

export default function StatusBar({ status }) {
  const meta = STATUS_META[status] ?? STATUS_META.idle;
  const { label, color, Icon, desc } = meta;

  return (
    <div className="flex items-center gap-3">
      {/* Animated status dot */}
      <motion.div
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: color,
          boxShadow: `0 0 8px ${color}`,
          flexShrink: 0,
        }}
        animate={{ opacity: [1, 0.4, 1], scale: [1, 0.85, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      />

      <AnimatePresence mode="wait">
        <motion.div
          key={status}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 8 }}
          transition={{ duration: 0.25 }}
          className="flex items-center gap-2"
        >
          <Icon size={13} style={{ color, opacity: 0.9 }} />
          <span style={{ fontSize: 12, fontWeight: 500, color, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            {label}
          </span>
          <span style={{ fontSize: 11, color: 'rgba(240,244,255,0.35)', letterSpacing: '0.02em' }}>
            {desc}
          </span>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
