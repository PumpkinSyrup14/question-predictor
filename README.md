# QPred — AI Exam Question Predictor

Predicts likely exam questions from past papers + module notes using Gemini 1.5 Flash.

## Stack
- **Frontend**: React + Vite
- **Backend**: Python + FastAPI
- **AI**: Google Gemini 1.5 Flash (free tier)
- **PDF Parsing**: PyMuPDF

## Setup

### 1. Backend
```bash
cd backend
pip install -r requirements.txt

cp .env.example .env
# Add your Gemini API key in .env

# Run
uvicorn main:app --reload
# Runs on http://localhost:8000
```

Get a free Gemini API key at: https://aistudio.google.com/app/apikey

### 2. Frontend
```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:5173
```

## How to Use
1. Enter subject name
2. Add your modules (rename them as needed)
3. Upload past papers (common for all modules)
4. Upload notes per module
5. Hit **Generate Predictions**

## Project Structure
```
question-predictor/
├── backend/
│   ├── main.py        # FastAPI app + routes
│   ├── parser.py      # PDF text extraction
│   ├── predictor.py   # Gemini API integration
│   └── requirements.txt
└── frontend/
    └── src/
        ├── App.jsx
        ├── UploadForm.jsx
        └── Results.jsx
```
