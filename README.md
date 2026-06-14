# QPred — AI Exam Question Predictor
 
> Upload your past papers and module notes/syllabus. Get predicted exam questions — before the exam.
 
QPred analyzes patterns across past university exam papers and cross-references them with your module notes to predict the most likely questions for each module. Questions are grouped by concept (not just copied from papers), ranked by confidence, and exportable as a clean PDF.
 
---
 
## Demo
 
![QPred Upload Screen](https://i.imgur.com/placeholder.png)
<!-- Replace with actual screenshot once deployed -->
 
---
 
## Features
 
- 📄 Upload past papers (common across modules) + notes per module
- 🤖 AI-powered concept extraction using Gemini 2.5 Flash
- 📊 Questions ranked by confidence — High / Medium / Low
- 🧠 Concept-based prediction (same idea, different framing across years)
- 📥 Export high confidence questions as a PDF
- ⚡ Per-module predictions with topic tagging
---
 
## Tech Stack
 
| Layer | Tech |
|---|---|
| Frontend | React + Vite |
| Backend | Python + FastAPI |
| AI | Google Gemini 2.5 Flash |
| PDF Parsing | pypdf |
| PDF Export | jsPDF |
 
---
 
## Getting Started
 
### Prerequisites
- Python 3.10+
- Node.js 18+
- A free Gemini API key → [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
### 1. Clone the repo
```bash
git clone https://github.com/PumpkinSyrup14/question-predictor.git
cd question-predictor
```
 
### 2. Backend setup
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# Paste your Gemini API key in .env
python -m uvicorn main:app --reload
# Runs on http://localhost:8000
```
 
### 3. Frontend setup
```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:5173
```
 
---
 
## How It Works
 
1. **PDF Parsing** — Past papers and notes are extracted into plain text using `pypdf`
2. **Prompt Engineering** — Extracted text is sent to Gemini with a structured prompt that instructs it to identify recurring concepts across papers, not just repeat questions
3. **Per-module Prediction** — Each module's notes are used to scope predictions — Gemini only predicts questions relevant to that module's content
4. **Confidence Scoring** — Questions are classified as High (tested 3+ times), Medium (tested once or heavily in notes), or Low (in notes but untested)
5. **PDF Export** — High confidence questions are exported as a clean A4 PDF
---
 
## Project Structure
 
```
question-predictor/
├── backend/
│   ├── main.py          # FastAPI app + routes
│   ├── parser.py        # PDF text extraction
│   ├── predictor.py     # Gemini API calls + prompt
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    └── src/
        ├── App.jsx        # Main app + state
        ├── UploadForm.jsx # Upload UI
        ├── Results.jsx    # Results + PDF export
        └── index.css
```
 
---
 
## Built By
 
[Sami Farhan](https://github.com/PumpkinSyrup14) — 2nd year CS student building tools that actually solve real problems.