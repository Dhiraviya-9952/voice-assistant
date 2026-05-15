import os
import wave
import pyaudio
import numpy as np
import re
from scipy.io import wavfile
from faster_whisper import WhisperModel

import voice_service as vs
from rag.AIVoiceAssistant import AIVoiceAssistant

DEFAULT_MODEL_SIZE = "tiny"
DEFAULT_CHUNK_LENGTH = 60 # Listen up to 60 seconds so user is not cut off

ai_assistant = AIVoiceAssistant()


def record_audio_chunk(audio, stream, chunk_length=DEFAULT_CHUNK_LENGTH):
    frames = []
    has_started_speaking = False
    silence_frames = 0
    max_silence_frames = int(16000 / 1024 * 1.0)  # 1.0 second of silence before processing
    
    # We will record up to chunk_length seconds, but break early if silence after speech
    for _ in range(0, int(16000 / 1024 * chunk_length)):
        data = stream.read(1024, exception_on_overflow=False)
        frames.append(data)
        
        # Check amplitude
        np_data = np.frombuffer(data, dtype=np.int16)
        amplitude = np.max(np.abs(np_data))
        
        # Threshold of 1200 ignores fan noise but catches speech easily
        if amplitude > 1200:
            has_started_speaking = True
            silence_frames = 0
        elif has_started_speaking:
            silence_frames += 1
            if silence_frames > max_silence_frames:
                break
                
    if not has_started_speaking:
        return True
                
    temp_file_path = 'temp_audio_chunk.wav'
    with wave.open(temp_file_path, 'wb') as wf:
        wf.setnchannels(1)
        wf.setsampwidth(audio.get_sample_size(pyaudio.paInt16))
        wf.setframerate(16000)
        wf.writeframes(b''.join(frames))

    return not has_started_speaking


    

def transcribe_audio(model, file_path):
    segments, info = model.transcribe(file_path, beam_size=1, vad_filter=True)
    transcription = ' '.join(segment.text for segment in segments)
    return transcription


def main():
    
    model_size = DEFAULT_MODEL_SIZE + ".en"
    model = WhisperModel(model_size, device="cpu", compute_type="int8", num_workers=10)
    
    audio = pyaudio.PyAudio()
    stream = audio.open(format=pyaudio.paInt16, channels=1, rate=16000, input=True, frames_per_buffer=1024)
    customer_input_transcription = ""

    try:
        while True:
            chunk_file = "temp_audio_chunk.wav"
            
            # Record audio chunk
            print("_")
            if not record_audio_chunk(audio, stream):
                # Transcribe audio
                transcription = transcribe_audio(model, chunk_file)
                os.remove(chunk_file)
                if not transcription.strip():
                    continue
                
                print("Customer:{}".format(transcription))
                
                # Add customer input to transcript
                customer_input_transcription += "Customer: " + transcription + "\n"
                
                # Process customer input and get response from AI assistant
                print("AI Assistant: ", end="", flush=True)
                stream.stop_stream()  # Pause microphone so it doesn't hear itself
                
                streamer = vs.TTSStreamer()
                current_sentence = ""
                
                for chunk in ai_assistant.interact_with_llm(transcription):
                    print(chunk, end="", flush=True)
                    current_sentence += chunk
                    
                    match = re.search(r'(?<=[.!?])\s+', current_sentence)
                    if match:
                        split_idx = match.start()
                        complete_sentence = current_sentence[:split_idx].strip()
                        remainder = current_sentence[match.end():]
                        
                        for marker in ["User:", "Assistant:", "Previous:", "Context:", "User asked:"]:
                            complete_sentence = complete_sentence.replace(marker, "")
                        if complete_sentence:
                            streamer.add_text(complete_sentence)
                        current_sentence = remainder
                        
                print()
                
                if current_sentence.strip():
                    clean_sent = current_sentence.strip()
                    for marker in ["User:", "Assistant:", "Previous:", "Context:", "User asked:"]:
                        clean_sent = clean_sent.replace(marker, "")
                    if clean_sent:
                        streamer.add_text(clean_sent)
                        
                streamer.wait_and_stop()
                stream.start_stream()


    
    except KeyboardInterrupt:
        print("\nStopping...")

    finally:
        stream.stop_stream()
        stream.close()
        audio.terminate()

if __name__ == "__main__":
    main()
