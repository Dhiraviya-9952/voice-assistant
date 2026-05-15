import os
import queue
import threading
import subprocess
from gtts import gTTS

class TTSStreamer:
    def __init__(self):
        self.text_queue = queue.Queue()
        self.is_running = True
        
        # Start a single continuous ffplay process reading from stdin
        self.ffplay_proc = subprocess.Popen(
            ['ffplay', '-nodisp', '-autoexit', '-probesize', '32', '-analyzeduration', '0', '-af', 'atempo=1.25', '-i', '-'],
            stdin=subprocess.PIPE,
            stderr=subprocess.DEVNULL,
            stdout=subprocess.DEVNULL
        )
        
        self.dl_thread = threading.Thread(target=self._download_worker, daemon=True)
        self.dl_thread.start()

    def _download_worker(self):
        idx = 0
        while self.is_running:
            try:
                text = self.text_queue.get(timeout=0.1)
                if text == "<STOP>":
                    self.ffplay_proc.stdin.close()
                    self.ffplay_proc.wait()
                    break
                
                if text.strip():
                    file_path = f"temp_chunk_{idx}.mp3"
                    tts = gTTS(text=text, lang='en', slow=False)
                    tts.save(file_path)
                    
                    # Pipe the audio directly into the running ffplay stream seamlessly
                    with open(file_path, 'rb') as f:
                        self.ffplay_proc.stdin.write(f.read())
                        self.ffplay_proc.stdin.flush()
                        
                    idx += 1
                    try:
                        os.remove(file_path)
                    except OSError:
                        pass
            except queue.Empty:
                continue
            except Exception:
                pass

    def add_text(self, text):
        self.text_queue.put(text)

    def wait_and_stop(self):
        self.text_queue.put("<STOP>")
        self.dl_thread.join()
