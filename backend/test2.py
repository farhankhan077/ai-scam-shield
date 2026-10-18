import os
from dotenv import load_dotenv
from langchain_google_genai import GoogleGenerativeAIEmbeddings

load_dotenv()
api_key = os.getenv("GOOGLE_API_KEY")

for model in ["models/gemini-embedding-2", "gemini-embedding-2", "models/text-embedding-004"]:
    print(f"\nTrying model: {model}")
    try:
        emb = GoogleGenerativeAIEmbeddings(model=model, google_api_key=api_key)
        res = emb.embed_query("test")
        print(f"SUCCESS! Length: {len(res)}")
    except Exception as e:
        print(f"FAILED: {e}")
