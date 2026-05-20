import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Settings, MessageSquare, Mic, Sparkles, Send, Globe, Zap, History, Sun, Moon, Power } from 'lucide-react';

import SiriOrb from './components/SiriOrb';
import ChatBubble from './components/ChatBubble';
import AmbientBackground from './components/AmbientBackground';
import ScreenEdgeGlow from './components/ScreenEdgeGlow';
import { useVoiceChat } from './hooks/useVoiceChat';

// ─── Status Label ─────────────────────────────────────────────────────────
function StatusLabel({ status }) {
  const cfg = {
    idle:         { text: 'Ready',                  dot: '#3b82f6', pulse: false },
    listening:    { text: 'Listening...',  dot: '#06b6d4', pulse: true  },
    thinking:     { text: 'Thinking...',            dot: '#8b5cf6', pulse: true  },
    speaking:     { text: 'Speaking',               dot: '#10b981', pulse: true  },
    disconnected: { text: 'OFFLINE',       dot: '#ef4444', pulse: false },
  };
  const { text, dot, pulse } = cfg[status] || cfg.idle;

  return (
    <motion.div
      key={status}
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -5 }}
      className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-[var(--bg-card)] backdrop-blur-md border border-[var(--border-subtle)]"
    >
      <motion.div
        style={{ width: 6, height: 6, borderRadius: '50%', background: dot }}
        animate={pulse ? { opacity: [1, 0.4, 1], scale: [1, 1.3, 1] } : {}}
        transition={{ duration: 1.5, repeat: Infinity }}
      />
      <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[var(--text-primary)] opacity-70">
        {text}
      </span>
    </motion.div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────
export default function App() {
  const chatEndRef = useRef(null);
  const { 
    isSessionActive, 
    status, 
    messages, 
    startSession, 
    stopSession, 
    clearMessages 
  } = useVoiceChat();

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.add('theme-light');
    } else {
      root.classList.remove('theme-light');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // Auto-scroll inside chat session
  useEffect(() => {
    if (isSessionActive) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isSessionActive]);

  return (
    <div className="relative w-full h-screen overflow-hidden flex flex-col bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans transition-colors duration-500">
      <AmbientBackground status={status} theme={theme} />
      <ScreenEdgeGlow status={status} />
      
      {/* ── Header ── */}
      <header className="relative z-50 flex items-center justify-between px-8 py-6">
        <div className="flex items-center gap-4 select-none">
          <img 
            src="/kyureeus_logo2.png" 
            alt="K" 
            className="h-12 w-auto object-contain" 
          />
          <div className="flex flex-col justify-center">
            <span 
              className="text-[27px] font-bold tracking-[0.22em] text-[var(--text-primary)] transition-colors duration-500 leading-[0.9]" 
              style={{ fontFamily: 'Space Grotesk, sans-serif' }}
            >
              YUREEUS
            </span>
            <span className="text-[9px] tracking-[0.32em] uppercase text-[var(--text-muted)] font-semibold mt-2 transition-colors duration-500 leading-[0.9]">
              A Rezilyens Company
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={toggleTheme} 
            className="p-2.5 rounded-full bg-[var(--header-btn-bg)] hover:opacity-80 transition-all border border-[var(--header-btn-border)] text-[var(--header-btn-text)] active:scale-95" 
            title={theme === 'light' ? 'Dark Theme' : 'Light Theme'}
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
          
          {isSessionActive && (
            <>
              <button 
                onClick={clearMessages} 
                className="p-2.5 rounded-full bg-[var(--header-btn-bg)] hover:opacity-80 transition-all border border-[var(--header-btn-border)] text-[var(--header-btn-text)] active:scale-95" 
                title="Clear Chat"
              >
                <Trash2 size={18} />
              </button>
              
              <button 
                className="p-2.5 rounded-full bg-[var(--header-btn-bg)] hover:opacity-80 transition-all border border-[var(--header-btn-border)] text-[var(--header-btn-text)] active:scale-95" 
                title="Settings"
              >
                <Settings size={18} />
              </button>

              <button 
                onClick={stopSession} 
                className="p-2.5 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-all border border-red-500/20 active:scale-95" 
                title="Stop Session"
              >
                <Power size={18} />
              </button>
            </>
          )}
        </div>
      </header>

      {/* ── Main Content Area ── */}
      <main className="relative z-10 flex-1 flex flex-col overflow-hidden">
        <AnimatePresence mode="wait">
          {!isSessionActive ? (
            /* ── Onboarding / Welcome Intro Page ── */
            <motion.div
              key="onboarding"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
              className="flex-1 flex flex-col justify-center items-center px-6 max-w-4xl mx-auto text-center overflow-y-auto py-12 scroll-container"
            >
              {/* Welcome Badge */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--accent-blue)]/10 border border-[var(--accent-blue)]/20 text-[var(--accent-blue)] text-xs font-semibold tracking-wider uppercase mb-6 select-none"
              >
                <Sparkles size={14} className="animate-pulse text-[var(--accent-blue)]" />
                Rezilyens Voice Assistant
              </motion.div>

              {/* Title */}
              <motion.h1 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-4xl md:text-5xl font-bold tracking-tight mb-4 leading-tight select-none"
                style={{ fontFamily: 'Space Grotesk, sans-serif' }}
              >
                Say Hello to <span className="bg-gradient-to-r from-[var(--accent-blue)] via-[var(--accent-cyan)] to-[var(--accent-purple)] bg-clip-text text-transparent">Sid</span>
              </motion.h1>

              {/* Subdescription */}
              <motion.p 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="text-[var(--text-secondary)] text-base md:text-lg max-w-xl mb-12 font-medium leading-relaxed select-none"
              >
                A high-performance conversational intelligence assistant. Experience natural, real-time voice interaction with zero latency.
              </motion.p>

              {/* Start Session Button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="mb-14"
              >
                <button 
                  onClick={startSession}
                  className="group relative px-8 py-4 rounded-full bg-gradient-to-r from-[var(--accent-blue)] to-[var(--accent-purple)] hover:from-[var(--accent-blue)] hover:to-[var(--accent-cyan)] text-white font-semibold text-sm tracking-widest uppercase shadow-[0_0_30px_rgba(59,130,246,0.25)] hover:shadow-[0_0_40px_rgba(6,182,212,0.4)] transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center gap-3 overflow-hidden"
                >
                  <div className="absolute inset-0 w-full h-full bg-white/10 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
                  <Mic size={18} className="text-white group-hover:animate-bounce" />
                  Start Voice Session
                </button>
              </motion.div>

              {/* Guidance Cards */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-3xl select-none"
              >
                <div className="flex flex-col items-center p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:border-[var(--accent-blue)]/30 transition-all duration-300 hover:translate-y-[-4px]">
                  <div className="p-3 rounded-xl bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] mb-4">
                    <MessageSquare size={20} />
                  </div>
                  <h3 className="text-sm font-semibold mb-2 tracking-wide uppercase">Ask Riddles & Queries</h3>
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                    "What has many teeth, but cannot bite?" Challenge Sid with riddles or logical questions.
                  </p>
                </div>

                <div className="flex flex-col items-center p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:border-[var(--accent-cyan)]/30 transition-all duration-300 hover:translate-y-[-4px]">
                  <div className="p-3 rounded-xl bg-[var(--accent-cyan)]/10 text-[var(--accent-cyan)] mb-4">
                    <Globe size={20} />
                  </div>
                  <h3 className="text-sm font-semibold mb-2 tracking-wide uppercase">Launch Browser Actions</h3>
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                    "Open YouTube" or "Search for cyber threats". Sid automates your commands instantly.
                  </p>
                </div>

                <div className="flex flex-col items-center p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:border-[var(--accent-purple)]/30 transition-all duration-300 hover:translate-y-[-4px]">
                  <div className="p-3 rounded-xl bg-[var(--accent-purple)]/10 text-[var(--accent-purple)] mb-4">
                    <Zap size={20} />
                  </div>
                  <h3 className="text-sm font-semibold mb-2 tracking-wide uppercase">Zero-Lag Real Time Speech</h3>
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                    Equipped with advanced VAD and real-time TTS synthesis for continuous, smooth replies.
                  </p>
                </div>
              </motion.div>
            </motion.div>
          ) : (
            /* ── Active Conversation Screen ── */
            <motion.div
              key="conversation"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
              className="flex-1 flex flex-col overflow-hidden"
            >
              <div className="flex-1 flex flex-col pt-4 overflow-hidden">
                {/* Messages Feed */}
                <div className="flex-1 overflow-y-auto px-6 space-y-8 scroll-container pb-12">
                  {messages.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-[var(--text-muted)] text-sm font-medium animate-pulse select-none">
                      Go ahead, start speaking to Sid...
                    </div>
                  ) : (
                    <AnimatePresence initial={false}>
                      {messages.map((msg, idx) => (
                        <ChatBubble 
                          key={idx} 
                          message={msg} 
                          isLatest={idx === messages.length - 1} 
                        />
                      ))}
                    </AnimatePresence>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Bottom Interactive Area */}
                <div className="relative z-20 flex flex-col items-center gap-4 py-8 bg-[var(--bg-primary)]/80 backdrop-blur-xl border-t border-[var(--border-subtle)] transition-colors duration-500">
                  {/* SiriOrb Center */}
                  <SiriOrb status={status} size={110} />

                  {/* Status Label Under Orb */}
                  <StatusLabel status={status} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Noise overlay */}
      <div className="noise-overlay" />
    </div>
  );
}
