import os
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()
api_key = os.getenv("GOOGLE_API_KEY")
genai.configure(api_key=api_key)

print("Available models:")
for m in genai.list_models():
    print(f"- {m.name} (methods: {m.supported_generation_methods})")
