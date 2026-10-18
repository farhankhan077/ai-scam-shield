# AI Scam Shield 🛡️

AI Scam Shield is an AI-powered banking transaction monitoring application that helps identify suspicious transactions using machine learning, risk scoring, and AI-generated explanations.

The goal is to help financial analysts prioritize potentially fraudulent transactions for investigation.

## ✨ Features

- **Transaction Risk Scoring:** Assign risk scores to transactions to help identify suspicious activity.
- **Fraud Detection:** Use a trained machine learning model to support transaction risk assessment.
- **Real-Time Transaction Feed:** View simulated transactions through a streaming interface.
- **AI-Powered Explanations:** Generate contextual explanations to help analysts understand flagged transactions.
- **Analyst Chat:** Interact with an AI assistant for fraud investigation support.
- **Analytics Dashboard:** View transaction trends and risk-related insights.

## 🛠️ Tech Stack

**Frontend**
- Next.js
- React
- TypeScript

**Backend**
- Python
- FastAPI
- XGBoost

**AI and Knowledge Retrieval**
- LangChain
- Google Gemini
- Retrieval-Augmented Generation (RAG)

## 🏗️ Project Structure

```text
ai-scam-shield/
├── backend/
│   ├── knowledge_base/
│   ├── main.py
│   ├── ai_chain.py
│   ├── rag_engine.py
│   ├── ml_scorer.py
│   ├── train_model.py
│   ├── fraud_model.pkl
│   └── requirements.txt
├── frontend/
│   ├── app/
│   ├── components/
│   ├── lib/
│   └── package.json
├── .gitignore
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Python 3.11
- Node.js and npm
- A Google Gemini API key for AI-powered features

### 1. Clone the repository

```bash
git clone https://github.com/farhankhan077/ai-scam-shield.git
cd ai-scam-shield
```

Replace `YOUR_USERNAME` with your GitHub username.

### 2. Start the backend

Open a terminal in the project root:

```powershell
cd backend
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Configure your environment variables using `.env.template` as a reference. Add your own API key locally; never commit real credentials.

Start the API:

```powershell
uvicorn main:app --reload
```

The backend should be available at `http://127.0.0.1:8000`.

### 3. Start the frontend

Open a second terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000` in your browser.

### 4. Verify the backend

Visit `http://127.0.0.1:8000/health` to check the backend health endpoint.

## 🔐 Security

- Never commit API keys, passwords, or private credentials.
- Keep local environment files out of version control.
- Review all public files before publishing.

## ⚠️ Disclaimer

AI Scam Shield is a demonstration project for fraud-risk assessment and analyst assistance. Risk scores and AI-generated explanations should support human review, not replace financial institution controls or investigation procedures.

## 👨‍💻 Author

Farhan Khan

GitHub: https://github.com/farhankhan077