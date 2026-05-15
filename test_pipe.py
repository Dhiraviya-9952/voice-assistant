from gtts import gTTS
import subprocess
import time

print("Starting ffplay...")
proc = subprocess.Popen(
    ['ffplay', '-nodisp', '-autoexit', '-probesize', '32', '-analyzeduration', '0', '-af', 'atempo=1.25', '-i', '-'],
    stdin=subprocess.PIPE,
    stderr=subprocess.DEVNULL,
    stdout=subprocess.DEVNULL
)

print("Generating sentence 1...")
t1 = gTTS(text="This is the first sentence.", lang='en')
t1.save("1.mp3")
with open("1.mp3", "rb") as f:
    proc.stdin.write(f.read())
    proc.stdin.flush()

print("Sleeping 1s to simulate generation...")
time.sleep(1)

print("Generating sentence 2...")
t2 = gTTS(text="And here is the second sentence, without any gaps.", lang='en')
t2.save("2.mp3")
with open("2.mp3", "rb") as f:
    proc.stdin.write(f.read())
    proc.stdin.flush()

proc.stdin.close()
proc.wait()
print("Done!")
