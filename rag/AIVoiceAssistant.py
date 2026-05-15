import requests
import re
import time
import webbrowser
import json
import datetime
from typing import Optional, Tuple, Dict

class AIVoiceAssistant:
    def __init__(self):
        self.model = "llama3.2:1b"
        self.ollama_url = "http://localhost:11434/api/generate"
        self.system_prompt = """You are a helpful and conversational AI assistant. 
Answer every question naturally and helpfully, exactly like a human would.
If you are asked personal or social questions (like 'How are you' or 'Can we be friends'), answer warmly and naturally.
Keep every response to 1-2 short sentences. 
Do NOT mention "Sid" or "Rezilyens" unless specifically asked for your name or identity."""
        self.memory = []
        print("Knowledgebase (Monitoring/Cybersecurity AI) loaded successfully!")

    def detect_action(self, text: str) -> Optional[Dict]:
        t = text.lower().strip()

        if re.search(r'\b(open|launch|start)\b', t):
            m = re.search(r'\b(?:open|launch|start)\s+(.+)', t)
            if m:
                return {"type": "open", "target": m.group(1).strip()}

        if re.search(r'\b(play|listen)\b', t):
            m = re.search(r'\b(?:play|listen)\s+(?:to\s+)?(.+)', t)
            if m:
                return {"type": "play", "target": m.group(1).strip()}

        if re.search(r'\b(search|google|find)\b', t):
            m = re.search(r'\b(?:search|google|find)\s+(?:for\s+)?(.+)', t)
            if m:
                return {"type": "search", "target": m.group(1).strip()}

        return None

    def get_action_url(self, action: Dict) -> str:
        target = action["target"]
        atype = action["type"]

        if atype == "open":
            sites = {
                "youtube": "https://youtube.com",
                "gmail": "https://gmail.com",
                "maps": "https://maps.google.com",
                "calendar": "https://calendar.google.com",
                "drive": "https://drive.google.com",
                "netflix": "https://netflix.com",
                "spotify": "https://open.spotify.com",
                "instagram": "https://instagram.com",
                "facebook": "https://facebook.com",
                "twitter": "https://twitter.com",
            }
            for key, url in sites.items():
                if key in target:
                    return url
            return f"https://www.google.com/search?q={target.replace(' ', '+')}"

        elif atype == "play":
            return f"https://www.youtube.com/results?search_query={target.replace(' ', '+')}"

        elif atype == "search":
            return f"https://www.google.com/search?q={target.replace(' ', '+')}"

        return ""

    def interact_with_llm(self, customer_query: str):
        normalized = customer_query.strip().rstrip('.,!?').lower()
        
        # Handle identity questions directly
        if any(q in normalized for q in ["name", "who are you", "yourself", "who is sid"]):
            yield "Hey, I'm Sid, the virtual assistant of Rezilyens. I'm here to help you with information about our organization and answer any questions you may have."
            return

        # Handle greetings directly
        if any(g == normalized for g in ["hello", "hi", "hey", "hi there", "hello there", "hey there", "howdy"]):
            yield "Hello, how can I assist you?"
            return

        # Handle specific social questions with flexible matching
        if "can we be friends" in normalized:
            yield "Of course! I'm happy to be your assistant and friend."
            return
            
        if "how are you" in normalized or "how was your day" in normalized:
            yield "I'm doing well, thank you! I'm here to help you."
            return

        if "interrupt" in normalized or "interruption" in normalized:
            yield "Yes, I can handle interruptions and respond to you instantly."
            return

        # Handle other social phrases
        social = {
            "thank you": "You're welcome! Let me know if you have any other questions.",
            "thanks": "You're welcome! Feel free to ask anything.",
            "ok": "Sure, let me know if you need anything!",
            "okay": "Sure, let me know if you need anything!",
            "bye": "Goodbye! Have a great day!",
            "goodbye": "Goodbye! Have a great day!",
        }
        if normalized in social:
            yield social[normalized]
            return

        action = self.detect_action(customer_query)
        if action:
            answers = {
                "open": f"Opening {action['target']}.",
                "play": f"Playing {action['target']}.",
                "search": f"Searching for {action['target']}."
            }
            answer = answers.get(action["type"], "Done.")
            url = self.get_action_url(action)
            if url:
                print(f"Executing Action: {action['type']} -> {url}")
                try:
                    webbrowser.open(url)
                except Exception as e:
                    print(f"Action error: {e}")
            
            self.memory.append(f"User asked: {customer_query}")
            yield answer
            return

        # Standard LLM flow - NO history passed to avoid 1B model confusion
        now = datetime.datetime.now()
        current_time = now.strftime("%I:%M %p")
        current_date = now.strftime("%A, %B %d, %Y")

        prompt = f"""{self.system_prompt}

[HIDDEN SYSTEM INFO: Current Time: {current_time}, Current Date: {current_date}]

User question: {customer_query}
Answer directly and only about this question. Do not bring up any other topic.
Assistant:"""

        try:
            resp = requests.post(
                self.ollama_url,
                json={
                    "model": self.model,
                    "prompt": prompt,
                    "stream": True,
                    "options": {
                        "num_predict": 150,
                        "temperature": 0.7,
                        "repeat_penalty": 1.2,
                        "stop": ["\nUser:", "\nAssistant:", "<|im_end|>"]
                    }
                },
                stream=True,
                timeout=10.0
            )

            full_answer = ""
            for line in resp.iter_lines():
                if line:
                    try:
                        data = json.loads(line)
                        chunk = data.get("response", "")
                        full_answer += chunk
                        yield chunk
                        
                        if data.get("done", False):
                            break
                    except Exception:
                        pass
                        
            clean_answer = full_answer.strip()
            for marker in ["User:", "Assistant:", "Previous:", "Context:"]:
                clean_answer = clean_answer.replace(marker, "")
                
            self.memory.append(f"User asked: {customer_query}")
                
        except Exception as e:
            print(f"LLM Error: {e}")
            yield "I had trouble with that."
