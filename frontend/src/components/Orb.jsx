import React, { useRef } from 'react';
import { motion } from 'framer-motion';

const STATUS_CONFIG = {
  idle: {
    colors: ['#1d4ed8', '#4f46e5', '#2563eb'],
    glowColor: 'rgba(59,130,246,0.45)',
    pulseScale: [1, 1.04, 1],
    pulseDuration: 4,
    rotateSpeed: 0,
    innerOpacity: [0.2, 0.35, 0.2],
  },
  listening: {
    colors: ['#06b6d4', '#3b82f6', '#0ea5e9'],
    glowColor: 'rgba(6,182,212,0.55)',
    pulseScale: [1, 1.15, 0.97, 1.1, 1],
    pulseDuration: 1.6,
    rotateSpeed: 8,
    innerOpacity: [0.4, 0.7, 0.4],
  },
  thinking: {
    colors: ['#8b5cf6', '#a855f7', '#6d28d9'],
    glowColor: 'rgba(139,92,246,0.5)',
    pulseScale: [1, 1.08, 0.96, 1.04, 1],
    pulseDuration: 2,
    rotateSpeed: 12,
    innerOpacity: [0.3, 0.6, 0.3],
  },
  speaking: {
    colors: ['#10b981', '#06b6d4', '#3b82f6'],
    glowColor: 'rgba(16,185,129,0.5)',
    pulseScale: [1, 1.2, 0.9, 1.15, 0.95, 1],
    pulseDuration: 0.55,
    rotateSpeed: 20,
    innerOpacity: [0.5, 0.9, 0.5],
  },
  disconnected: {
    colors: ['#374151', '#4b5563', '#374151'],
    glowColor: 'rgba(100,100,120,0.2)',
    pulseScale: [1, 1.02, 1],
    pulseDuration: 6,
    rotateSpeed: 0,
    innerOpacity: [0.1, 0.15, 0.1],
  },
};

export default function Orb({ status = 'idle' }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.idle;

  const gradientId = `orb-grad-${status}`;
  const blurId = `orb-blur-${status}`;

  return (
    <div className="orb-container" style={{ width: 200, height: 200 }}>
      {/* Deep ambient glow — outermost */}
      <motion.div
        className="orb-glow-layer"
        style={{
          width: 320,
          height: 320,
          inset: -60,
          background: cfg.glowColor,
          opacity: 0,
        }}
        animate={{ opacity: [0.25, 0.55, 0.25] }}
        transition={{ duration: cfg.pulseDuration * 1.2, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Middle halo ring */}
      <motion.div
        style={{
          position: 'absolute',
          inset: -24,
          borderRadius: '50%',
          border: `1.5px solid ${cfg.glowColor}`,
        }}
        animate={{ opacity: [0.15, 0.45, 0.15], scale: [1, 1.05, 1] }}
        transition={{ duration: cfg.pulseDuration, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Orb Body */}
      <motion.div
        className="orb-core"
        style={{
          width: 180,
          height: 180,
          borderRadius: '50%',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: `0 0 60px -10px ${cfg.glowColor}, 0 0 120px -20px ${cfg.glowColor}`,
        }}
        animate={{
          scale: cfg.pulseScale,
          rotate: cfg.rotateSpeed > 0
            ? [0, 360]
            : undefined,
        }}
        transition={{
          scale: { duration: cfg.pulseDuration, repeat: Infinity, ease: 'easeInOut' },
          rotate: cfg.rotateSpeed > 0
            ? { duration: 60 / cfg.rotateSpeed, repeat: Infinity, ease: 'linear' }
            : undefined,
        }}
      >
        {/* Gradient background */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at 35% 30%, ${cfg.colors[0]} 0%, ${cfg.colors[1]} 45%, ${cfg.colors[2]} 100%)`,
            borderRadius: '50%',
          }}
        />

        {/* Swirl / specular highlight */}
        <motion.div
          style={{
            position: 'absolute',
            top: '12%',
            left: '18%',
            width: '55%',
            height: '45%',
            borderRadius: '50% 60% 40% 60%',
            background: 'rgba(255,255,255,0.18)',
            filter: 'blur(12px)',
          }}
          animate={{ opacity: cfg.innerOpacity }}
          transition={{ duration: cfg.pulseDuration * 0.8, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Secondary inner swirl */}
        <motion.div
          style={{
            position: 'absolute',
            bottom: '15%',
            right: '15%',
            width: '35%',
            height: '30%',
            borderRadius: '40% 60% 60% 40%',
            background: 'rgba(255,255,255,0.1)',
            filter: 'blur(8px)',
          }}
          animate={{ opacity: [0.05, 0.2, 0.05] }}
          transition={{ duration: cfg.pulseDuration * 1.3, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
        />

        {/* Dark overlay for depth */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            background: 'radial-gradient(ellipse at 70% 75%, rgba(0,0,0,0.35) 0%, transparent 60%)',
          }}
        />
      </motion.div>

      {/* Listening-specific ripple rings */}
      {status === 'listening' && [0, 1, 2].map((i) => (
        <motion.div
          key={i}
          style={{
            position: 'absolute',
            inset: 0,
            margin: 'auto',
            width: 180,
            height: 180,
            borderRadius: '50%',
            border: '1.5px solid rgba(6,182,212,0.6)',
          }}
          animate={{ scale: [1, 2.2], opacity: [0.5, 0] }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: i * 0.65,
            ease: 'easeOut',
          }}
        />
      ))}

      {/* Speaking-specific beat rings */}
      {status === 'speaking' && [0, 1].map((i) => (
        <motion.div
          key={i}
          style={{
            position: 'absolute',
            inset: 0,
            margin: 'auto',
            width: 180,
            height: 180,
            borderRadius: '50%',
            border: '2px solid rgba(16,185,129,0.5)',
          }}
          animate={{ scale: [1, 1.7], opacity: [0.6, 0] }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: i * 0.4,
            ease: 'easeOut',
          }}
        />
      ))}
    </div>
  );
}
