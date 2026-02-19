
# 🧠 SmartNotes: AI-Powered Lecture Notes Generator

**SmartNotes** is an advanced AI-driven application designed to transform educational content into concise, actionable study materials. Whether it's a live classroom lecture or a YouTube video, SmartNotes leverages state-of-the-art NLP models to transcribe, summarize, and even quiz you on the content.

![Project Preview](https://img.shields.io/badge/Status-Live-success?style=for-the-badge)
![Live Demo](https://img.shields.io/badge/Live-Hugging%20Face-FFD21E?style=for-the-badge&logo=huggingface&link=https://huggingface.co/spaces/vincymicheal/Lecture-Voice-to-Notes)
![Tech Stack](https://img.shields.io/badge/Tech-React%20%7C%20Flask%20%7C%20AI-blue?style=for-the-badge)

🚀 **[Try the Live Web App Here!](https://huggingface.co/spaces/vincymicheal/Lecture-Voice-to-Notes)**

---

## ✨ Key Features

### 📺 1. YouTube Smart Summary
Paste any YouTube link, and SmartNotes will automatically:
- Fetch the lecture transcript instantly.
- Generate a high-quality summary (approx. 350-500 words).
- Provide a set of interactive quizzes to test your knowledge.
- **Reliable Fallback**: If YouTube blocks the server or a video has no captions, the system provides expert-written fallback summaries on topics like AI, ML, and Data Structures to ensure a continuous learning experience.

### 🎙️ 2. Live Lecture Recording
Record your professor or speaker in real-time:
- **Real-Time Transcription**: Watch the words appear as they are spoken.
- **Instant Summarization**: One click transforms the entire transcript into bulleted notes.
- **Auto-Cleaning**: The AI removes "filler words" (ums, ahs) to keep your notes professional.

### 📝 3. Interactive Quizzes
- Automatically generated questions based on the lecture content.
- Instant feedback with "Correct/Wrong" indicators.
- Final score calculation and evaluation.

---

## 🚀 Technology Stack

- **Frontend**: React.js with modern CSS (Glassmorphism & Dark Mode).
- **Backend**: Flask (Python) with RESTful API architecture.
- **AI Models**: 
  - **BART (Facebook)**: Fine-tuned for high-accuracy summarization of long technical texts.
  - **OpenAI Whisper**: High-fidelity speech-to-text transcription.
- **OCR/Scripting**: `youtube-transcript-api` for direct text fetching.
- **Containerization**: Docker for seamless cloud deployment.

---

## 🛠️ Local Installation & Setup

### Prerequisites
- Node.js (v18+)
- Python (v3.11+)
- whisper
- Docker (Optional)

### Step 1: Clone the Repository
```bash
git clone https://github.com/Vimali23vincy/Lecture-Voice-to-Notes-Generator.git
cd ai-powered-notes-master
```

### Step 2: Backend Setup
```bash
cd backend/api
pip install -r requirements.txt
python app.py
```

### Step 3: Frontend Setup
```bash
cd frontend
npm install
npm start
```

---

## ☁️ Deployment

This project is optimized for **Hugging Face Spaces** using Docker.

1. Create a new Space on [Hugging Face](https://huggingface.co/new-space).
2. Select **Docker** as the SDK.
3. Push the codebase. The `Dockerfile` is pre-configured to build the frontend and serve it via the Flask backend on port `7860`.

---

## 📂 Project Structure

```text
├── backend/
│   └── api/
│       ├── app.py              # Main Flask server & Fallback Logic
│       ├── summarization_model.py # AI Summarization Logic
│       ├── transcribe.py       # Whisper Transcription Logic
│       └── requirements.txt    # Python Dependencies
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Link/           # YouTube Summary UI
│   │   │   └── Record/         # Live Recording UI
│   │   └── App.js              # Main Routing
│   └── package.json            # Node Dependencies
└── Dockerfile                  # Unified Build Script
```

---

## 📝 License
This project is licensed under the MIT License.

---
*Created with ❤️ for students by [Vimali Vincy M](https://github.com/Vimali23vincy)*
