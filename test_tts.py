import queue
import threading
import os
import time
from gtts import gTTS

class TTSStreamer:
    def __init__(self):
        self.text_queue = queue.Queue()
        self.audio_queue = queue.Queue()
        self.is_running = True
        
        self.dl_thread = threading.Thread(target=self._download_worker)
        self.dl_thread.start()
        
        self.play_thread = threading.Thread(target=self._play_worker)
        self.play_thread.start()

    def _download_worker(self):
        idx = 0
        while self.is_running:
            try:
                text = self.text_queue.get(timeout=0.5)
                if text == "<STOP>":
                    self.audio_queue.put("<STOP>")
                    break
                
                file_path = f"temp_chunk_{idx}.mp3"
                tts = gTTS(text=text, lang='en', slow=False)
                tts.save(file_path)
                self.audio_queue.put(file_path)
                idx += 1
            except queue.Empty:
                continue
            except Exception as e:
                print(f"TTS Error: {e}")

    def _play_worker(self):
        while self.is_running:
            try:
                file_path = self.audio_queue.get(timeout=0.5)
                if file_path == "<STOP>":
                    break
                
                os.system(f'ffplay -nodisp -autoexit -probesize 32 -analyzeduration 0 -af "atempo=1.25" {file_path} >/dev/null 2>&1')
                
                try:
                    os.remove(file_path)
                except OSError:
                    pass
            except queue.Empty:
                continue

    def add_text(self, text):
        self.text_queue.put(text)

    def wait_and_stop(self):
        self.text_queue.put("<STOP>")
        self.dl_thread.join()
        self.play_thread.join()
        self.is_running = False

streamer = TTSStreamer()
streamer.add_text("Hello there.")
streamer.add_text("This is a second sentence.")
streamer.wait_and_stop()
