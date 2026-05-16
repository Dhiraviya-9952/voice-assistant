import React from 'react';
import { motion } from 'framer-motion';

// Typing effect for assistant messages
function TypedText({ text, isStreaming }) {
  return (
    <span className="leading-relaxed tracking-wide">
      {text}
      {isStreaming && <span className="cursor-blink" />}
    </span>
  );
}

const KyureeusLogo = () => (
  <div className="w-8 h-8 rounded-full bg-[#1a1a2e] flex items-center justify-center border border-blue-500/30 overflow-hidden flex-shrink-0">
    <div className="relative w-full h-full flex items-center justify-center">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20" />
      <span className="text-blue-400 font-bold text-[10px] z-10">K</span>
    </div>
  </div>
);

const UserAvatar = () => (
  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-lg border border-white/10 flex-shrink-0">
    <div className="w-4 h-4 rounded-full bg-white/20 relative">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-2 h-2 rounded-full bg-white/40" />
      </div>
    </div>
  </div>
);

export default function ChatBubble({ message, isLatest }) {
  const isAssistant = message.role === 'assistant';
  const isStreaming = isAssistant && isLatest && message.streaming !== false;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={`flex items-start gap-3 ${isAssistant ? 'justify-start' : 'justify-end'}`}
    >
      {/* Avatar for Assistant (Left side) */}
      {isAssistant && <KyureeusLogo />}

      <div className={`flex flex-col ${isAssistant ? 'items-start' : 'items-end'} max-w-[80%]`}>
        <div
          className={`px-5 py-3.5 rounded-3xl text-sm leading-relaxed ${
            isAssistant 
              ? 'bg-[#12121a] text-zinc-300 border border-white/5' 
              : 'bg-gradient-to-br from-indigo-600 to-blue-700 text-white font-medium'
          }`}
          style={{
            backdropFilter: 'blur(10px)',
            boxShadow: isAssistant ? '0 10px 30px -10px rgba(0,0,0,0.5)' : '0 10px 30px -10px rgba(37, 99, 235, 0.3)'
          }}
        >
          <TypedText text={message.content} isStreaming={isStreaming} />
        </div>
      </div>

      {/* Avatar for User (Right side) */}
      {!isAssistant && <UserAvatar />}
    </motion.div>
  );
}
