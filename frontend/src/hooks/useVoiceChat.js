import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * useVoiceChat
 *
 * Manages:
 *  - WebSocket connection to the FastAPI backend (/ws/chat)
 *  - Microphone capture via ScriptProcessor → binary frames
 *  - Audio playback queue (ordered MP3 chunks from TTS)
 *  - Status machine: idle → listening → thinking → speaking → idle
 *  - Message history with streaming flag for typing cursor
 */
export function useVoiceChat() {
  const [status, setStatus]   = useState('disconnected');
  const [messages, setMessages] = useState([]);

  const wsRef                  = useRef(null);
  const audioQueueRef          = useRef([]);
  const isPlayingRef           = useRef(false);
  const awaitPlaybackRef       = useRef(false);
  const reconnectTimerRef      = useRef(null);

  const audioCtxRef            = useRef(null);
  const analyserRef            = useRef(null);
  const activeAudioRef         = useRef(null);

  // ── Audio playback queue ──────────────────────────────────────
  const playNext = useCallback(() => {
    if (audioQueueRef.current.length === 0) {
      isPlayingRef.current = false;
      window.assistantVolume = 0;
      if (awaitPlaybackRef.current && wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'playback_done' }));
        awaitPlaybackRef.current = false;
      }
      return;
    }
    isPlayingRef.current = true;
    const url = audioQueueRef.current.shift();
    const audio = new Audio(url);
    activeAudioRef.current = audio;
    
    // Connect to Web Audio Analyser
    const ctx = audioCtxRef.current;
    if (ctx) {
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
      try {
        const source = ctx.createMediaElementSource(audio);
        if (!analyserRef.current) {
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 32;
          analyserRef.current = analyser;
          analyser.connect(ctx.destination);
          window.assistantAnalyser = analyser;
        }
        source.connect(analyserRef.current);
      } catch (err) {
        console.warn("Web Audio Analyser hook warning:", err);
      }
    }
    
    audio.onended = () => { 
      if (activeAudioRef.current === audio) {
        activeAudioRef.current = null;
      }
      URL.revokeObjectURL(url); 
      playNext(); 
    };
    
    audio.onerror = () => { 
      if (activeAudioRef.current === audio) {
        activeAudioRef.current = null;
      }
      URL.revokeObjectURL(url); 
      playNext(); 
    };
    
    audio.play().catch(() => playNext());
  }, []);

  // ── Mark the last assistant message as done streaming ─────────
  const finalizeLastMessage = useCallback(() => {
    setMessages(prev => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      if (last?.role === 'assistant' && last.streaming) {
        const updated = [...prev];
        updated[updated.length - 1] = { ...last, streaming: false };
        return updated;
      }
      return prev;
    });
  }, []);

  // ── WebSocket + Mic setup ─────────────────────────────────────
  useEffect(() => {
    let micActive  = true;
    let micStream  = null;
    let processor  = null;
    let ctx        = null;
    let socket     = null;

    function connect() {
      const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host  = window.location.hostname;
      socket = new WebSocket(`${proto}//${host}:8001/ws/chat`);
      socket.binaryType = 'arraybuffer';
      wsRef.current = socket;

      socket.onopen = () => {
        console.log('🔌 WebSocket connected');
        // status will be set by server's connection_ready message
      };

      socket.onclose = () => {
        console.warn('🔌 WebSocket disconnected — retrying in 3 s');
        setStatus('disconnected');
        reconnectTimerRef.current = setTimeout(connect, 3000);
      };

      socket.onerror = (err) => {
        console.error('WebSocket error', err);
      };

      socket.onmessage = (e) => {
        // ── Binary frame = MP3 audio chunk ──────────────────
        if (e.data instanceof ArrayBuffer) {
          const blob = new Blob([e.data], { type: 'audio/mpeg' });
          const url  = URL.createObjectURL(blob);
          audioQueueRef.current.push(url);
          if (!isPlayingRef.current) playNext();
          return;
        }

        // ── JSON control message ─────────────────────────────
        let d;
        try { d = JSON.parse(e.data); } catch { return; }

        switch (d.type) {
          case 'connection_ready':
            setStatus('idle');
            break;

          case 'user_listening':
            setStatus('listening');
            break;

          case 'thinking':
            setStatus('thinking');
            break;

          case 'mute_mic':
            // Clear audio queue — assistant is about to speak
            audioQueueRef.current = [];
            isPlayingRef.current  = false;
            try {
              activeAudioRef.current?.pause();
              if (activeAudioRef.current?.src) {
                URL.revokeObjectURL(activeAudioRef.current.src);
              }
            } catch (err) {}
            activeAudioRef.current = null;
            break;

          case 'stream_start':
            setMessages(prev => [
              ...prev,
              { role: 'assistant', content: '', streaming: true },
            ]);
            break;

          case 'stream_token':
            setMessages(prev => {
              const last = prev[prev.length - 1];
              if (last?.role === 'assistant') {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  ...last,
                  content: last.content + (d.text ?? ''),
                };
                return updated;
              }
              return prev;
            });
            break;

          case 'stream_end':
            finalizeLastMessage();
            break;

          case 'assistant_speaking':
            setStatus('speaking');
            break;

          case 'await_playback_done':
            awaitPlaybackRef.current = true;
            if (!isPlayingRef.current && audioQueueRef.current.length === 0) {
              socket.send(JSON.stringify({ type: 'playback_done' }));
              awaitPlaybackRef.current = false;
            }
            break;

          case 'assistant_idle':
            setStatus('idle');
            break;

          case 'user':
            setMessages(prev => [
              ...prev,
              { role: 'user', content: d.text ?? '' },
            ]);
            break;

          default:
            break;
        }
      };
    }

    connect();

    // ── Microphone ────────────────────────────────────────────
    async function startMic() {
      try {
        micStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            channelCount: 1,
            sampleRate: 48000,
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
          video: false,
        });
        if (!micActive) return;

        ctx = new AudioContext({ sampleRate: 48000 });
        audioCtxRef.current = ctx;
        const source = ctx.createMediaStreamSource(micStream);
        
        // 2x digital gain boost to ensure laptop microphones capture speech perfectly from a distance
        const gainNode = ctx.createGain();
        gainNode.gain.value = 2.0;
        
        processor = ctx.createScriptProcessor(1024, 1, 1);
        processor.onaudioprocess = (ev) => {
          // Optimization: Only send audio if the assistant is idle or listening.
          // This prevents self-hearing/echo and reduces backend processing load.
          if (
            wsRef.current?.readyState === WebSocket.OPEN && 
            status !== 'thinking' && 
            status !== 'speaking'
          ) {
            wsRef.current.send(ev.inputBuffer.getChannelData(0).buffer);
          }
        };
        source.connect(gainNode);
        gainNode.connect(processor);
        processor.connect(ctx.destination);
        console.log('🎙️ Microphone active');
      } catch (err) {
        console.error('Mic error:', err);
      }
    }

    startMic();

    // ── Cleanup ───────────────────────────────────────────────
    return () => {
      micActive = false;
      clearTimeout(reconnectTimerRef.current);
      socket?.close();
      processor?.disconnect();
      ctx?.close();
      micStream?.getTracks().forEach(t => t.stop());
    };
  }, [playNext, finalizeLastMessage]);

  return {
    status,
    messages,
    clearMessages: () => setMessages([]),
  };
}
