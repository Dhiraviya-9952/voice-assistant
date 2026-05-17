import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Wave Canvas Animation ─────────────────────────────────────────────────
function WaveCanvas({ status }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const timeRef = useRef(0);

  const colorMap = {
    idle:         { bg: '#0a1628', w1: '#1e40af', w2: '#2563eb', w3: '#1d4ed8' },
    listening:    { bg: '#021520', w1: '#0891b2', w2: '#06b6d4', w3: '#22d3ee' },
    thinking:     { bg: '#120828', w1: '#6d28d9', w2: '#7c3aed', w3: '#a78bfa' },
    speaking:     { bg: '#021a12', w1: '#047857', w2: '#10b981', w3: '#34d399' },
    disconnected: { bg: '#0a0a14', w1: '#1f2937', w2: '#374151', w3: '#4b5563' },
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    const colors = colorMap[status] || colorMap.idle;

    const speedMap = { idle: 0.4, listening: 2.2, thinking: 1.4, speaking: 2.0, disconnected: 0.1 };
    const ampMap   = { idle: 12,  listening: 32,  thinking: 22,  speaking: 28,  disconnected: 4  };
    const speed = speedMap[status] || 0.4;
    const amp   = ampMap[status] || 12;

    function drawWave(phase, amplitude, yBase, color, alpha) {
      ctx.beginPath();
      ctx.moveTo(0, yBase);
      for (let x = 0; x <= W; x++) {
        const y = yBase
          + Math.sin((x / W) * Math.PI * 3 + phase) * amplitude
          + Math.sin((x / W) * Math.PI * 5 + phase * 1.3) * (amplitude * 0.4)
          + Math.sin((x / W) * Math.PI * 1.5 + phase * 0.7) * (amplitude * 0.6);
        ctx.lineTo(x, y);
      }
      ctx.lineTo(W, H);
      ctx.lineTo(0, H);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.globalAlpha = alpha;
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    const draw = () => {
      timeRef.current += speed * 0.022;
      const t = timeRef.current;

      // Background
      ctx.clearRect(0, 0, W, H);
      const grad = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W / 2);
      grad.addColorStop(0, colors.bg);
      grad.addColorStop(1, '#020205');
      ctx.fillStyle = grad;
      ctx.globalAlpha = 1;
      ctx.fillRect(0, 0, W, H);

      // Waves stacked from bottom
      drawWave(t * 0.8,        amp * 0.6, H * 0.72, colors.w1, 0.55);
      drawWave(t + Math.PI,    amp * 0.8, H * 0.62, colors.w2, 0.45);
      drawWave(t * 1.2 + 1.5,  amp,       H * 0.52, colors.w3, 0.35);

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [status]);

  return (
    <canvas
      ref={canvasRef}
      width={320}
      height={320}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        borderRadius: '50%',
        display: 'block',
      }}
    />
  );
}

// ─── State Config ──────────────────────────────────────────────────────────
const STATE_CFG = {
  idle:         { glow: 'rgba(59,130,246,0.3)',   ring: '#3b82f6', pulse: [1, 1.03, 1],  dur: 4,   ripples: 0, glowOpacity: [0.2, 0.5, 0.2] },
  listening:    { glow: 'rgba(6,182,212,0.55)',   ring: '#06b6d4', pulse: [1, 1.08, 1],  dur: 1.5, ripples: 3, glowOpacity: [0.4, 0.75, 0.4] },
  thinking:     { glow: 'rgba(139,92,246,0.45)',  ring: '#7c3aed', pulse: [1, 1.05, 1],  dur: 2,   ripples: 2, glowOpacity: [0.3, 0.65, 0.3] },
  speaking:     { glow: 'rgba(16,185,129,0.5)',   ring: '#10b981', pulse: [1, 1.06, 1],  dur: 2,   ripples: 2, glowOpacity: [0.4, 0.7, 0.4] },
  disconnected: { glow: 'rgba(100,100,120,0.15)', ring: '#4b5563', pulse: [1, 1, 1],     dur: 8,   ripples: 0, glowOpacity: [0.1, 0.2, 0.1] },
};

// ─── SiriOrb ───────────────────────────────────────────────────────────────
export default function SiriOrb({ status = 'idle', size = 200 }) {
  const cfg = STATE_CFG[status] || STATE_CFG.idle;
  const SIZE = size;

  return (
    <div
      style={{
        position: 'relative',
        width: SIZE,
        height: SIZE,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* ── Deep ambient glow blob ── */}
      <motion.div
        style={{
          position: 'absolute',
          width: SIZE + 120,
          height: SIZE + 120,
          top: -(60),
          left: -(60),
          borderRadius: '50%',
          background: cfg.glow,
          filter: 'blur(48px)',
          pointerEvents: 'none',
        }}
        animate={{ opacity: cfg.glowOpacity, scale: [1, 1.06, 1] }}
        transition={{ duration: cfg.dur, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* ── Outer ring ── */}
      <motion.div
        style={{
          position: 'absolute',
          width: SIZE + 24,
          height: SIZE + 24,
          top: -12,
          left: -12,
          borderRadius: '50%',
          border: `1.5px solid ${cfg.ring}`,
          opacity: 0,
        }}
        animate={{ opacity: [0.1, 0.35, 0.1], scale: [1, 1.04, 1] }}
        transition={{ duration: cfg.dur * 1.2, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* ── Globe body ── */}
      <motion.div
        style={{
          position: 'relative',
          width: SIZE,
          height: SIZE,
          borderRadius: '50%',
          overflow: 'hidden',
          boxShadow: `0 0 60px -10px ${cfg.glow}, 0 0 120px -20px ${cfg.glow}, inset 0 0 30px rgba(0,0,0,0.6)`,
          border: `1px solid rgba(255,255,255,0.08)`,
        }}
        animate={{ 
          scale: cfg.pulse,
          boxShadow: [
            `0 0 60px -10px ${cfg.glow}, 0 0 120px -20px ${cfg.glow}`,
            `0 0 80px 0px ${cfg.glow}, 0 0 160px -10px ${cfg.glow}`,
            `0 0 60px -10px ${cfg.glow}, 0 0 120px -20px ${cfg.glow}`
          ]
        }}
        transition={{ duration: cfg.dur, repeat: Infinity, ease: 'easeInOut' }}
      >
        {/* Wave canvas */}
        <WaveCanvas status={status} />

        {/* Glass top reflection */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            background:
              'radial-gradient(ellipse at 32% 22%, rgba(255,255,255,0.16) 0%, transparent 55%)',
            pointerEvents: 'none',
            zIndex: 2,
          }}
        />

        {/* Bottom shadow depth */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            background:
              'radial-gradient(ellipse at 65% 80%, rgba(0,0,0,0.55) 0%, transparent 60%)',
            pointerEvents: 'none',
            zIndex: 2,
          }}
        />
      </motion.div>

      {/* ── Ripple rings ── */}
      <AnimatePresence>
        {cfg.ripples > 0 &&
          Array.from({ length: cfg.ripples }).map((_, i) => (
            <motion.div
              key={`${status}-ripple-${i}`}
              style={{
                position: 'absolute',
                width: SIZE,
                height: SIZE,
                borderRadius: '50%',
                border: `1.5px solid ${cfg.ring}`,
                top: 0,
                left: 0,
              }}
              initial={{ scale: 1, opacity: 0.55 }}
              animate={{ scale: 2.1, opacity: 0 }}
              transition={{
                duration: status === 'speaking' ? 1.2 : 2.2,
                repeat: Infinity,
                delay: i * (status === 'speaking' ? 0.4 : 0.7),
                ease: 'easeOut',
              }}
            />
          ))}
      </AnimatePresence>

      {/* ── Mic icon (center, above the globe) ── */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10,
          pointerEvents: 'none',
        }}
      >
        <MicIcon status={status} ringColor={cfg.ring} size={SIZE} />
      </div>
    </div>
  );
}

// ─── Mic Icon Component ────────────────────────────────────────────────────
function MicIcon({ status, ringColor, size }) {
  const isListening = status === 'listening';
  const isSpeaking  = status === 'speaking';
  const isThinking  = status === 'thinking';
  
  const iconSize = Math.max(24, size * 0.28);
  const btnSize = Math.max(40, size * 0.4);

  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>

      {/* Mic button blink ring */}
      <AnimatePresence>
        {(isListening || isSpeaking) && (
          <motion.div
            key="mic-blink-ring"
            style={{
              position: 'absolute',
              width: btnSize + 16,
              height: btnSize + 16,
              borderRadius: '50%',
              border: `2px solid ${ringColor}`,
            }}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: [1, 1.3, 1], opacity: [0.7, 0, 0.7] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.4, repeat: Infinity, ease: 'easeOut' }}
          />
        )}
      </AnimatePresence>

      {/* Main mic button pill */}
      <motion.div
        style={{
          width: btnSize,
          height: btnSize,
          borderRadius: '50%',
          background: isListening
            ? 'linear-gradient(135deg, #0891b2, #06b6d4)'
            : isSpeaking
            ? 'linear-gradient(135deg, #047857, #10b981)'
            : isThinking
            ? 'linear-gradient(135deg, #5b21b6, #7c3aed)'
            : 'rgba(0,0,0,0.45)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          border: `1.5px solid ${isListening || isSpeaking ? ringColor : 'rgba(255,255,255,0.15)'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: isListening || isSpeaking
            ? `0 0 20px ${ringColor}88, 0 4px 20px rgba(0,0,0,0.5)`
            : '0 4px 20px rgba(0,0,0,0.5)',
        }}
        animate={
          isListening
            ? { scale: [1, 1.08, 1] }
            : isSpeaking
            ? { scale: [1, 1.08, 1] }
            : { scale: 1 }
        }
        transition={{ duration: isListening ? 1.4 : 1.4, repeat: Infinity, ease: 'easeInOut' }}
      >
        <AnimatePresence mode="wait">
          {isThinking ? (
            <motion.div
              key="thinking"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ display: 'flex', gap: 4 }}
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  style={{ width: 4, height: 4, borderRadius: '50%', background: '#ffffff' }}
                  animate={{ y: [0, -6, 0], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.2, ease: 'easeInOut' }}
                />
              ))}
            </motion.div>
          ) : (
            <motion.svg
              key="mic"
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              width={iconSize}
              height={iconSize}
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" x2="12" y1="19" y2="22" />
            </motion.svg>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
