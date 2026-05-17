import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Settings, MessageSquare, Mic, Sparkles, Send, Globe, Zap, History } from 'lucide-react';

import SiriOrb from './components/SiriOrb';
import ChatBubble from './components/ChatBubble';
import AmbientBackground from './components/AmbientBackground';
import { useVoiceChat } from './hooks/useVoiceChat';

// ─── Status Label ─────────────────────────────────────────────────────────
function StatusLabel({ status }) {
  const cfg = {
    idle:         { text: 'Ready',                  dot: '#3b82f6', pulse: false },
    listening:    { text: 'Podia is listening...',  dot: '#06b6d4', pulse: true  },
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
      className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/5 backdrop-blur-md border border-white/10"
    >
      <motion.div
        style={{ width: 6, height: 6, borderRadius: '50%', background: dot }}
        animate={pulse ? { opacity: [1, 0.4, 1], scale: [1, 1.3, 1] } : {}}
        transition={{ duration: 1.5, repeat: Infinity }}
      />
      <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-white/70">
        {text}
      </span>
    </motion.div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────
export default function App() {
  const chatEndRef = useRef(null);
  const [inputText, setInputText] = useState('');
  const { status, messages, clearMessages } = useVoiceChat();

  const hasMessages = messages.length > 0;
  const isActive = status === 'listening' || status === 'speaking' || status === 'thinking';

  // Auto-scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="relative w-full h-screen overflow-hidden flex flex-col bg-[#030308] text-white font-sans">
      <AmbientBackground status={status} />
      
      {/* ── Header ── */}
      <header className="relative z-50 flex items-center justify-between px-8 py-6">
        <div className="flex items-center">
          <img src="/kyureeus_logo.png" alt="KYUREEUS" className="h-12 w-auto object-contain" />
        </div>
        
        <div className="flex items-center gap-3">
          <button onClick={clearMessages} className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 transition-colors border border-white/5">
            <Trash2 size={18} className="text-white/50" />
          </button>
          <button className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 transition-colors border border-white/5">
            <Settings size={18} className="text-white/50" />
          </button>
        </div>
      </header>

      {/* ── Main Content Area ── */}
      <main className="relative z-10 flex-1 flex flex-col overflow-hidden">
        
        <div className="flex-1 flex flex-col pt-4 overflow-hidden">
          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto px-6 space-y-8 scroll-container pb-12">
            <AnimatePresence initial={false}>
              {messages.map((msg, idx) => (
                <ChatBubble 
                  key={idx} 
                  message={msg} 
                  isLatest={idx === messages.length - 1} 
                />
              ))}
            </AnimatePresence>
            <div ref={chatEndRef} />
          </div>

          {/* Bottom Orb Area with Separator Line */}
          <div className="relative z-20 flex flex-col items-center py-8 bg-[#030308]/80 backdrop-blur-xl border-t border-white/10">
             <SiriOrb status={status} size={130} />
             <div className="mt-4">
                <StatusLabel status={status} />
             </div>
          </div>
        </div>
      </main>

      {/* Noise overlay */}
      <div className="noise-overlay" />
    </div>
  );
}
