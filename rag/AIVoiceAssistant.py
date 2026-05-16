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
        
        # Identity: ONLY fire for direct questions about the assistant itself
        identity_triggers = [
            r"who are you", r"what is your name", r"tell me about yourself",
            r"introduce yourself", r"who is sid", r"what's your name"
        ]
        if any(re.search(trigger, normalized) for trigger in identity_triggers):
            # Only trigger if the question is ONLY about identity, not a longer question containing 'name'
            if len(normalized.split()) < 10:
                yield "Hey, I'm Sid, the virtual assistant of Rezilyens. I'm here to help you with information about our organization and answer any questions you may have."
                return

        # Simple social bypass to keep it fast
        social_map = {
            "hello": "Hello! How can I help you today?",
            "hi": "Hi there! What can I do for you?",
            "hey": "Hey! How's it going?",
            "how are you": "I'm doing great, thank you! How are you?",
            "thank you": "You're very welcome!",
            "thanks": "Anytime! Happy to help.",
            "bye": "Goodbye! Have a great day!",
        }
        if normalized in social_map:
            yield social_map[normalized]
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

        # Standard LLM flow
        now = datetime.datetime.now()
        current_time = now.strftime("%I:%M %p")
        current_date = now.strftime("%A, %B %d, %Y")

        # Refined system prompt for Gemini/ChatGPT-like behavior
        professional_prompt = """You are a highly intelligent and helpful AI assistant, similar to Gemini or ChatGPT.
Your name is Sid, and you are developed by Rezilyens.
RESPONSE RULES:
1. Be direct, concise, and professional.
2. If the user asks a riddle or a fact, answer it accurately and immediately.
3. Keep responses to 1-2 sentences unless a longer explanation is absolutely necessary.
4. Do NOT repeat your name or identity unless specifically asked.
5. If you don't know the answer, say so politely instead of guessing.
6. Current context: Time is {time}, Date is {date}."""

        prompt = f"""{professional_prompt.format(time=current_time, date=current_date)}

User: {customer_query}
Assistant:"""

        try:
            resp = requests.post(
                self.ollama_url,
                json={
                    "model": self.model,
                    "prompt": prompt,
                    "stream": True,
                    "options": {
                        "num_predict": 100,
                        "temperature": 0.3, # Lower temperature for higher accuracy
                        "top_p": 0.9,
                        "repeat_penalty": 1.1,
                        "stop": ["User:", "Assistant:", "\n"]
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
                        if data.get("done", False): break
                    except Exception: pass
                        
            self.memory.append(f"User asked: {customer_query}")
                
        except Exception as e:
            print(f"LLM Error: {e}")
            yield "I'm sorry, I'm having trouble processing that right now."
