import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useAnimationFrame } from 'framer-motion';

// ─── Wave Canvas Animation ─────────────────────────────────────────────────
function WaveCanvas({ status }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const timeRef = useRef(0);

  const colorMap = {
    idle:         { bg: '#000000', w1: '#1e3a8a', w2: '#3b82f6', w3: '#1d4ed8' },
    listening:    { bg: '#000000', w1: '#0891b2', w2: '#06b6d4', w3: '#22d3ee' },
    thinking:     { bg: '#000000', w1: '#5b21b6', w2: '#7c3aed', w3: '#a78bfa' },
    speaking:     { bg: '#000000', w1: '#047857', w2: '#10b981', w3: '#34d399' }, // Green waves
    disconnected: { bg: '#000000', w1: '#1f2937', w2: '#374151', w3: '#4b5563' },
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

      // High-sensitivity real-time time-domain analysis (amplitude)
      let volume = 0;
      if (window.assistantAnalyser) {
        const fftSize = window.assistantAnalyser.fftSize;
        const dataArray = new Uint8Array(fftSize);
        window.assistantAnalyser.getByteTimeDomainData(dataArray);
        
        let deviationSum = 0;
        for (let i = 0; i < fftSize; i++) {
          deviationSum += Math.abs(dataArray[i] - 128);
        }
        volume = (deviationSum / fftSize) * 3.5; // Scale up to normalize
      }

      // Modulate waves based on assistant speaking volume
      let currentAmp = amp;
      if (status === 'speaking') {
        const volRatio = Math.min(1.0, volume / 100);
        const volFactor = 0.15 + volRatio * 2.3; // Calmer at silence, highly energetic at peaks
        currentAmp = amp * volFactor;
      }

      // Background
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = colors.bg;
      ctx.fillRect(0, 0, W, H);

      // Waves stacked from bottom
      drawWave(t * 0.8,        currentAmp * 0.6, H * 0.72, colors.w1, 0.55);
      drawWave(t + Math.PI,    currentAmp * 0.8, H * 0.62, colors.w2, 0.45);
      drawWave(t * 1.2 + 1.5,  currentAmp,       H * 0.52, colors.w3, 0.35);

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [status]);

  return (
    <canvas
      ref={canvasRef}
      width={240}
      height={240}
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

const ORB_THEMES = {
  idle: {
    gradient: 'conic-gradient(from 0deg, #0284c7, #3b82f6, #06b6d4, #0284c7)',
    glow: 'rgba(59, 130, 246, 0.3)',
    glowSize: 45,
    speed: 3.5
  },
  listening: {
    gradient: 'conic-gradient(from 0deg, #22d3ee, #06b6d4, #3b82f6, #0891b2, #22d3ee)',
    glow: 'rgba(6, 182, 212, 0.55)',
    glowSize: 60,
    speed: 2.2
  },
  thinking: {
    gradient: 'conic-gradient(from 0deg, #c084fc, #7c3aed, #8b5cf6, #a78bfa, #c084fc)',
    glow: 'rgba(139, 92, 246, 0.55)',
    glowSize: 60,
    speed: 1.8
  },
  speaking: {
    gradient: 'conic-gradient(from 0deg, #34d399, #10b981, #059669, #064e3b, #34d399)',
    glow: 'rgba(16, 185, 129, 0.65)',
    glowSize: 60,
    speed: 2.2
  },
  disconnected: {
    gradient: 'conic-gradient(from 0deg, #4b5563, #374151, #9ca3af, #4b5563)',
    glow: 'rgba(107, 114, 128, 0.2)',
    glowSize: 30,
    speed: 6.0
  }
};

export default function SiriOrb({ status = 'idle', size = 110 }) {
  const theme = ORB_THEMES[status] || ORB_THEMES.idle;
  const borderThickness = 3.5; // thickness of the glowing ring border in px

  const smoothedVolumeRef = useRef(0);

  // Reactive motion values for 120FPS smooth sound-reactivity
  const ringScale = useMotionValue(1);
  const ringOpacity = useMotionValue(1);
  const glowScale = useMotionValue(1);
  const glowOpacity = useMotionValue(1);

  // Dynamic frame loop for the rotating outline ring
  useAnimationFrame(() => {
    let targetVolume = 0;
    if (window.assistantAnalyser) {
      const fftSize = window.assistantAnalyser.fftSize;
      const dataArray = new Uint8Array(fftSize);
      window.assistantAnalyser.getByteTimeDomainData(dataArray);
      
      let deviationSum = 0;
      for (let i = 0; i < fftSize; i++) {
        deviationSum += Math.abs(dataArray[i] - 128);
      }
      targetVolume = (deviationSum / fftSize) * 3.5; // Scale up to normalize
    }

    // Exponential moving average filter (Low-pass DSP filter) for natural, fluid flow
    smoothedVolumeRef.current = smoothedVolumeRef.current * 0.82 + targetVolume * 0.18;
    const volume = smoothedVolumeRef.current;

    if (status === 'speaking' && volume > 1.5) {
      const volRatio = Math.min(1.0, volume / 100); // Normalize based on average peak volume

      // Beautifully smooth, organic sound-reactive outline scale & opacity pulsing!
      const scaleVal = 0.98 + volRatio * 0.18; // Scales smoothly from 0.98 to 1.16!
      const opacityVal = 0.5 + volRatio * 0.5; // Opacity smoothly blends from 0.5 to 1.0!
      
      ringScale.set(scaleVal);
      ringOpacity.set(opacityVal);

      // Smoothly pulse the outer glow in perfect harmony
      glowScale.set(1.0 + volRatio * 0.10);
      glowOpacity.set(0.6 + volRatio * 0.4);
    } else {
      // Organic slow breathing if idle, listening, thinking, or silent
      const time = Date.now() * 0.003;
      const breathingFactor = Math.sin(time) * 0.5 + 0.5; // 0 to 1
      
      const baseScale = status === 'thinking' ? 1.03 : status === 'listening' ? 1.05 : 1.02;
      const scaleVal = 1.0 + breathingFactor * (baseScale - 1.0);
      const opacityVal = 0.7 + breathingFactor * 0.3;
      
      ringScale.set(scaleVal);
      ringOpacity.set(opacityVal);

      glowScale.set(1.0);
      glowOpacity.set(0.8 + breathingFactor * 0.2);
    }
  });

  return (
    <div
      style={{
        position: 'relative',
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* ── Dynamic sound-reactive outer glow ── */}
      <motion.div
        key={`${status}-glow`}
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          boxShadow: `0 0 ${theme.glowSize}px ${theme.glowSize * 0.4}px ${theme.glow}`,
          pointerEvents: 'none',
          zIndex: 1,
          scale: glowScale,
          opacity: glowOpacity,
        }}
      />

      {/* ── Rotating Sound-Reactive Gradient Ring ── */}
      <motion.div
        key={`${status}-ring`}
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          background: theme.gradient,
          zIndex: 2,
          scale: ringScale,
          opacity: ringOpacity,
        }}
        animate={{
          rotate: 360
        }}
        transition={{
          rotate: {
            duration: theme.speed,
            repeat: Infinity,
            ease: 'linear'
          }
        }}
      />

      {/* ── Solid Black Inner Circle with Sound-Reactive Waveform ── */}
      <div
        style={{
          position: 'absolute',
          inset: borderThickness, // Leaves a perfect thin border
          borderRadius: '50%',
          backgroundColor: '#000000',
          zIndex: 3,
          boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.8), 0 0 10px rgba(0,0,0,0.5)',
          overflow: 'hidden',
        }}
      >
        <WaveCanvas status={status} />
      </div>
    </div>
  );
}
