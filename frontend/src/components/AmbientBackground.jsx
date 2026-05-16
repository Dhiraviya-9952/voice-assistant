import React from 'react';
import { motion } from 'framer-motion';

const BLOB_SETS = {
  idle: [
    { top: '10%', left: '15%', size: 500, color: '#1e3a8a', opacity: 0.07, dur: 22 },
    { top: '75%', left: '80%', size: 450, color: '#312e81', opacity: 0.06, dur: 28 },
    { top: '50%', left: '50%', size: 700, color: '#0c4a6e', opacity: 0.04, dur: 32 },
  ],
  listening: [
    { top: '5%',  left: '10%', size: 550, color: '#0e7490', opacity: 0.12, dur: 14 },
    { top: '80%', left: '75%', size: 500, color: '#0891b2', opacity: 0.10, dur: 18 },
    { top: '45%', left: '55%', size: 750, color: '#164e63', opacity: 0.07, dur: 24 },
    { top: '20%', left: '70%', size: 380, color: '#06b6d4', opacity: 0.08, dur: 16 },
  ],
  thinking: [
    { top: '8%',  left: '20%', size: 520, color: '#4c1d95', opacity: 0.12, dur: 12 },
    { top: '72%', left: '70%', size: 480, color: '#5b21b6', opacity: 0.10, dur: 16 },
    { top: '40%', left: '45%', size: 720, color: '#2e1065', opacity: 0.07, dur: 20 },
    { top: '60%', left: '15%', size: 360, color: '#7c3aed', opacity: 0.09, dur: 14 },
  ],
  speaking: [
    { top: '5%',  left: '8%',  size: 540, color: '#064e3b', opacity: 0.12, dur: 10 },
    { top: '78%', left: '78%', size: 490, color: '#047857', opacity: 0.10, dur: 14 },
    { top: '42%', left: '50%', size: 740, color: '#022c22', opacity: 0.07, dur: 18 },
    { top: '25%', left: '72%', size: 370, color: '#10b981', opacity: 0.08, dur: 12 },
  ],
  disconnected: [
    { top: '15%', left: '12%', size: 400, color: '#1f2937', opacity: 0.05, dur: 40 },
    { top: '70%', left: '82%', size: 380, color: '#374151', opacity: 0.04, dur: 45 },
  ],
};

export default function AmbientBackground({ status }) {
  const blobs = BLOB_SETS[status] || BLOB_SETS.idle;

  return (
    <div
      className="fixed inset-0 z-0 overflow-hidden pointer-events-none"
      style={{ background: '#020205' }}
    >
      {/* Deep centre glow */}
      <motion.div
        className="absolute inset-0"
        style={{
          background:
            status === 'listening'
              ? 'radial-gradient(ellipse at 50% 65%, rgba(6,182,212,0.06) 0%, transparent 70%)'
              : status === 'speaking'
              ? 'radial-gradient(ellipse at 50% 65%, rgba(16,185,129,0.06) 0%, transparent 70%)'
              : status === 'thinking'
              ? 'radial-gradient(ellipse at 50% 65%, rgba(139,92,246,0.06) 0%, transparent 70%)'
              : 'radial-gradient(ellipse at 50% 65%, rgba(59,130,246,0.04) 0%, transparent 70%)',
        }}
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Animated blobs */}
      {blobs.map((b, i) => (
        <motion.div
          key={`${status}-blob-${i}`}
          className="absolute rounded-full"
          style={{
            top: b.top,
            left: b.left,
            width: b.size,
            height: b.size,
            background: b.color,
            opacity: b.opacity,
            filter: 'blur(90px)',
            transform: 'translate(-50%, -50%)',
            willChange: 'transform',
          }}
          animate={{
            x: [0, 50, -40, 30, 0],
            y: [0, -40, 50, -25, 0],
            scale: [1, 1.25, 0.85, 1.15, 1],
          }}
          transition={{
            duration: b.dur,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 2.5,
          }}
        />
      ))}

      {/* Vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 50% 50%, transparent 30%, rgba(2,2,5,0.7) 100%)',
        }}
      />

      {/* Noise texture */}
      <div
        className="absolute inset-0 opacity-[0.025] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: '128px 128px',
        }}
      />
    </div>
  );
}
