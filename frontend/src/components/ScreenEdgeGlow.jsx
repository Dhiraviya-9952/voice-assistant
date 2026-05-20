import React, { useRef } from 'react';
import { motion, useMotionValue, useAnimationFrame, useTransform } from 'framer-motion';

export default function ScreenEdgeGlow({ status }) {
  const smoothedVolumeRef = useRef(0);
  const glowOpacity = useMotionValue(0.7);
  const gradientAngle = useMotionValue(0);
  const waveTime = useMotionValue(0);
  const waveScale = useMotionValue(6);

  useAnimationFrame((time) => {
    // 1. Slow, smooth gradient rotation
    const angle = (time * 0.04) % 360;
    gradientAngle.set(angle);

    // 2. Drive the turbulence time value
    waveTime.set(time);

    // 3. Opacity and Wave Warp control based on speech status
    if (status !== 'speaking') {
      // Gentle breathing pulse
      const breathingVal = Math.sin(time * 0.002) * 0.12 + 0.68;
      glowOpacity.set(breathingVal);

      // Low constant ripple amplitude when quiet
      const quietWarp = Math.sin(time * 0.001) * 2 + 5;
      waveScale.set(quietWarp);
      return;
    }

    // Voice reactive blinking and wave warping when speaking
    let targetVolume = 0;
    if (window.assistantAnalyser) {
      const fftSize = window.assistantAnalyser.fftSize;
      const dataArray = new Uint8Array(fftSize);
      window.assistantAnalyser.getByteTimeDomainData(dataArray);
      
      let deviationSum = 0;
      for (let i = 0; i < fftSize; i++) {
        deviationSum += Math.abs(dataArray[i] - 128);
      }
      targetVolume = (deviationSum / fftSize) * 3.5;
    }

    smoothedVolumeRef.current = smoothedVolumeRef.current * 0.82 + targetVolume * 0.18;
    const volume = smoothedVolumeRef.current;

    if (volume > 1.5) {
      const volRatio = Math.min(1.0, volume / 100);
      
      // Dynamic opacity flash (0.35 to 1.0)
      const opacityVal = 0.35 + volRatio * 0.65;
      glowOpacity.set(opacityVal);

      // Waveform warp amplification (warps up to 35px for peak volume)
      const warpVal = 5 + volRatio * 30;
      waveScale.set(warpVal);
    } else {
      glowOpacity.set(0.35);
      waveScale.set(4);
    }
  });

  // Convert raw angle to gradient transform string
  const gradientTransform = useTransform(gradientAngle, (a) => `rotate(${a}, 0.5, 0.5)`);

  // Slowly morph the baseFrequency parameters to animate the wave motion over time
  const baseFreqString = useTransform(waveTime, (t) => {
    const tSec = t * 0.0015;
    const xFreq = 0.014 + Math.sin(tSec * 1.3) * 0.003;
    const yFreq = 0.024 + Math.cos(tSec * 0.9) * 0.004;
    return `${xFreq} ${yFreq}`;
  });

  const getColorScheme = (stat) => {
    switch (stat) {
      case 'listening':
        return {
          stop1: 'var(--accent-cyan)',
          stop2: '#3b82f6',
        };
      case 'thinking':
        return {
          stop1: 'var(--accent-purple)',
          stop2: '#d946ef',
        };
      case 'speaking':
        return {
          stop1: 'var(--accent-green)',
          stop2: '#34d399',
        };
      case 'disconnected':
        return {
          stop1: '#4b5563',
          stop2: '#9ca3af',
        };
      default: // idle
        return {
          stop1: 'var(--accent-blue)',
          stop2: '#60a5fa',
        };
    }
  };

  const scheme = getColorScheme(status);

  return (
    <motion.div 
      className="fixed inset-0 pointer-events-none z-40"
      style={{ opacity: glowOpacity }}
    >
      <svg className="w-full h-full animate-pulse-slow" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <motion.linearGradient 
            id="screenEdgeGrad" 
            x1="0%" 
            y1="0%" 
            x2="100%" 
            y2="0%"
            gradientTransform={gradientTransform}
          >
            <stop offset="0%" stopColor={scheme.stop1} />
            <stop offset="50%" stopColor={scheme.stop2} />
            <stop offset="100%" stopColor={scheme.stop1} />
          </motion.linearGradient>
          
          {/* ── High-Fidelity Liquid Waveform Filter ── */}
          <filter id="neonWaveGlow" x="-20%" y="-20%" width="140%" height="140%">
            {/* Turbulence creates organic wavy noise */}
            <motion.feTurbulence 
              type="fractalNoise" 
              baseFrequency={baseFreqString}
              numOctaves="3" 
              result="noise" 
            />
            {/* Displacement map warps the border path into waves */}
            <motion.feDisplacementMap 
              in="SourceGraphic" 
              in2="noise" 
              scale={waveScale} 
              xChannelSelector="R" 
              yChannelSelector="G" 
              result="displaced"
            />
            {/* Soft bloom glow for visual depth */}
            <feGaussianBlur in="displaced" stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="displaced" />
            </feMerge>
          </filter>
        </defs>
        
        <rect 
          x="6" 
          y="6" 
          width="calc(100% - 12px)" 
          height="calc(100% - 12px)" 
          fill="none" 
          stroke="url(#screenEdgeGrad)" 
          strokeWidth="6" 
          filter="url(#neonWaveGlow)"
          rx="12"
        />
      </svg>
    </motion.div>
  );
}
