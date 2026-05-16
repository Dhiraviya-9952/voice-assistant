import io
import re
import asyncio
import numpy as np
import subprocess
import json
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from faster_whisper import WhisperModel
from gtts import gTTS
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime

from rag.AIVoiceAssistant import AIVoiceAssistant

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# --- AUDIO SETTINGS ---
SILENCE_THRESHOLD = 0.08  # Increased to match terminal-like sensitivity (1200/32768 approx 0.036, but float needs more buffer)
RMS_THRESHOLD = 0.025
MAX_SILENCE_SECS = 1.0
MIN_SPEECH_SECS = 0.5     # Slightly longer to filter out coughs/noises
SAMPLE_RATE = 48000
CHUNK_SIZE = 1024

# Common Whisper hallucinations to ignore
HALLUCINATIONS = [
    r"thank you", r"i'm sorry", r"you're welcome", r"subscribe to", 
    r"i'm going to have a fight", r"watch more", r"thanks for watching"
]

executor = ThreadPoolExecutor(max_workers=8)

print("📦 Loading models...")
# Use vad_filter=True and slightly higher beam size for accuracy
whisper_model = WhisperModel("tiny.en", device="cpu", compute_type="int8", num_workers=4)
ai_assistant = AIVoiceAssistant()

def speed_up_audio(mp3_bytes: bytes, speed: float = 1.25) -> bytes:
    cmd = ["ffmpeg", "-i", "pipe:0", "-af", f"atempo={speed}", "-f", "mp3", "pipe:1"]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL)
    out, _ = proc.communicate(input=mp3_bytes)
    return out

def make_tts(text: str) -> bytes:
    tts = gTTS(text=text, lang="en")
    buf = io.BytesIO()
    tts.write_to_fp(buf)
    return speed_up_audio(buf.getvalue(), 1.25)

@app.websocket("/ws/chat")
async def ws_handler(websocket: WebSocket):
    await websocket.accept()
    print("🚀 Client connected")

    audio_buffer = []
    is_speaking_vad = False
    silence_frames = 0
    speech_frames = 0
    is_muted = False

    max_silence_frames = int((SAMPLE_RATE / CHUNK_SIZE) * MAX_SILENCE_SECS)
    min_speech_frames = int((SAMPLE_RATE / CHUNK_SIZE) * MIN_SPEECH_SECS)

    try:
        await websocket.send_json({"type": "connection_ready"})

        while True:
            try:
                data = await websocket.receive()
            except RuntimeError:
                break

            if "text" in data:
                try:
                    msg = json.loads(data["text"])
                    if msg.get("type") == "playback_done":
                        is_muted = False
                        await websocket.send_json({"type": "assistant_idle"})
                except: pass
                continue

            if "bytes" not in data or is_muted:
                continue

            chunk = np.frombuffer(data["bytes"], dtype=np.float32)
            if len(chunk) == 0: continue

            amplitude = float(np.max(np.abs(chunk)))

            if amplitude > SILENCE_THRESHOLD:
                if not is_speaking_vad:
                    is_speaking_vad = True
                    speech_frames = 0
                speech_frames += 1
                silence_frames = 0
                audio_buffer.append(chunk)
                if speech_frames == min_speech_frames:
                    await websocket.send_json({"type": "user_listening"})
            elif is_speaking_vad:
                silence_frames += 1
                audio_buffer.append(chunk)
                if silence_frames > max_silence_frames:
                    if speech_frames < min_speech_frames:
                        audio_buffer, is_speaking_vad, silence_frames, speech_frames = [], False, 0, 0
                        continue

                    await websocket.send_json({"type": "thinking"})
                    full_audio = np.concatenate(audio_buffer)
                    rms = float(np.sqrt(np.mean(full_audio ** 2)))
                    
                    if rms < RMS_THRESHOLD:
                        audio_buffer, is_speaking_vad, silence_frames, speech_frames = [], False, 0, 0
                        await websocket.send_json({"type": "assistant_idle"})
                        continue

                    # Transcribe
                    audio_16k = full_audio[::3]
                    def _transcribe():
                        # Increased beam size to 5 for better stability against noise
                        segs, _ = whisper_model.transcribe(audio_16k, beam_size=5, vad_filter=True)
                        return " ".join(s.text for s in segs).strip()
                    
                    text = await asyncio.get_event_loop().run_in_executor(executor, _transcribe)
                    
                    junk = [r"^\s*$", r"^[\.\'\,\!\?\s]+$", r"^(uh+|um+|ah+|hmm+)[\.\s]*$"]
                    
                    # Filter out noise-induced hallucinations
                    is_hallucination = any(re.search(p, text, re.I) for p in HALLUCINATIONS)
                    
                    if not text or is_hallucination or any(re.match(p, text, re.I) for p in junk):
                        if is_hallucination:
                            print(f"🔇 Filtered hallucination: '{text}'")
                        audio_buffer, is_speaking_vad, silence_frames, speech_frames = [], False, 0, 0
                        await websocket.send_json({"type": "assistant_idle"})
                        continue

                    # Valid speech
                    is_muted = True
                    await websocket.send_json({"type": "mute_mic"})
                    print(f"👤 User: {text}")
                    await websocket.send_json({"type": "user", "text": text})
                    await websocket.send_json({"type": "stream_start"})

                    full_response = ""
                    current_sentence = ""
                    tts_tasks = []

                    for token in ai_assistant.interact_with_llm(text):
                        full_response += token
                        current_sentence += token
                        await websocket.send_json({"type": "stream_token", "text": token})
                        if re.search(r"[.!?]\s*$", current_sentence):
                            if current_sentence.strip():
                                task = asyncio.get_event_loop().run_in_executor(executor, make_tts, current_sentence.strip())
                                tts_tasks.append(task)
                            current_sentence = ""

                    if current_sentence.strip():
                        task = asyncio.get_event_loop().run_in_executor(executor, make_tts, current_sentence.strip())
                        tts_tasks.append(task)

                    await websocket.send_json({"type": "stream_end"})
                    await websocket.send_json({"type": "assistant_speaking"})

                    for audio_bytes in await asyncio.gather(*tts_tasks):
                        await websocket.send_bytes(audio_bytes)

                    await websocket.send_json({"type": "await_playback_done"})
                    print(f"🤖 {full_response}")
                    audio_buffer, is_speaking_vad, silence_frames, speech_frames = [], False, 0, 0

    except WebSocketDisconnect: print("❌ Client disconnected")
    except Exception as e: print(f"⚠ Error: {e}")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)
