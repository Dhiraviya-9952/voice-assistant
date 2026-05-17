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
  <div className="w-10 h-10 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center border border-[var(--border-subtle)] overflow-hidden flex-shrink-0">
    <img src="/kyureeus_logo2.png" alt="K" className="w-full h-full object-contain scale-110" />
  </div>
);

const UserAvatar = () => (
  <div className="w-10 h-10 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center border border-[var(--border-subtle)] overflow-hidden flex-shrink-0 shadow-lg">
    <img src="/user_avatar.png" alt="User" className="w-full h-full object-cover scale-150" />
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
              ? 'bg-[var(--bubble-assistant-bg)] text-[var(--text-primary)] border border-[var(--bubble-assistant-border)]' 
              : 'bg-gradient-to-br from-indigo-600 to-blue-700 text-white font-medium'
          }`}
          style={{
            backdropFilter: 'blur(10px)',
            boxShadow: isAssistant ? '0 10px 30px -10px var(--bubble-assistant-shadow)' : '0 10px 30px -10px var(--bubble-user-shadow)'
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
