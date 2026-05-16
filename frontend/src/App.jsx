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
    disconnected: { text: 'Reconnecting...',       dot: '#ef4444', pulse: false },
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
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold tracking-tighter gradient-text-blue" style={{ fontFamily: 'Space Grotesk' }}>
            KYUREEUS
          </h1>
          <span className="text-[9px] tracking-[0.3em] uppercase text-white/30 font-medium">A Rezilyens Company</span>
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
        
        <AnimatePresence mode="wait">
          {!hasMessages ? (
            /* ── HOME SCREEN ── */
            <motion.div 
              key="home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex-1 flex flex-col items-center justify-center px-6"
            >
              {/* Greeting */}
              <div className="text-center mb-16">
                <motion.h2 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-5xl font-bold mb-4"
                  style={{ fontFamily: 'Space Grotesk' }}
                >
                  Hi, Alex!
                </motion.h2>
                <p className="text-white/40 text-lg">How can I help you today?</p>
              </div>

              {/* Large Central Orb */}
              <div className="relative mb-16">
                <SiriOrb status={status} size={280} />
                <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 w-max">
                  <StatusLabel status={status} />
                </div>
              </div>

              {/* Action Chips */}
              <div className="flex flex-wrap justify-center gap-3 max-w-2xl mt-8">
                {[
                  { icon: MessageSquare, text: 'Chat with me' },
                  { icon: Globe, text: 'Search the web' },
                  { icon: Zap, text: 'Analyze image' },
                  { icon: History, text: 'View history' }
                ].map((chip, i) => (
                  <motion.button
                    key={i}
                    whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.1)' }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-2.5 px-6 py-3 rounded-full bg-white/5 border border-white/10 text-sm font-medium"
                  >
                    <chip.icon size={16} className="text-blue-400" />
                    {chip.text}
                  </motion.button>
                ))}
              </div>

              {/* Popular Topics */}
              <div className="mt-16 w-full max-w-4xl">
                <p className="text-white/30 text-[11px] uppercase tracking-widest font-bold mb-6 text-center">Popular topics</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { title: 'Cybersecurity News', desc: 'Latest threats and updates', icon: '🛡️' },
                    { title: 'AI Research', desc: 'Breakthroughs in LLMs', icon: '🧠' },
                    { title: 'Cloud Architecture', desc: 'Modern infra patterns', icon: '☁️' }
                  ].map((topic, i) => (
                    <div key={i} className="p-5 rounded-2xl bg-white/5 border border-white/10 glass-hover cursor-pointer">
                      <div className="text-2xl mb-3">{topic.icon}</div>
                      <h3 className="font-semibold text-sm mb-1">{topic.title}</h3>
                      <p className="text-white/40 text-[11px]">{topic.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : (
            /* ── CHAT SCREEN ── */
            <motion.div 
              key="chat"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-1 flex flex-col pt-4 overflow-hidden"
            >
              {/* Messages Feed */}
              <div className="flex-1 overflow-y-auto px-6 space-y-8 scroll-container pb-40">
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

              {/* Centered Small Orb Overlay for Chat */}
              <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center">
                 <SiriOrb status={status} size={140} />
                 <div className="mt-4">
                    <StatusLabel status={status} />
                 </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Input Bar ── */}
        <div className="relative z-30 px-6 py-8">
          <div className="max-w-4xl mx-auto flex items-center gap-4">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Ask me anything..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-full py-4 pl-6 pr-14 text-sm focus:outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 transition-all"
              />
              <button className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-blue-500 text-white hover:bg-blue-400 transition-colors">
                <Send size={18} />
              </button>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`p-4 rounded-full border transition-all ${
                status === 'listening' 
                ? 'bg-blue-500 border-blue-400 text-white shadow-[0_0_20px_rgba(59,130,246,0.4)]' 
                : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
              }`}
            >
              <Mic size={22} />
            </motion.button>
          </div>
        </div>
      </main>

      {/* Noise overlay */}
      <div className="noise-overlay" />
    </div>
  );
}
