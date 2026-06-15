from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
from typing import List
import json

from parser import extract_text_from_pdf
from predictor import predict_questions

app = FastAPI(title="Question Predictor API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "https://question-predictor-nu.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"status": "running"}


@app.post("/predict")
async def predict(
    subject: str = Form(...),
    module_names: str = Form(...),       # JSON array of module name strings
    past_papers: List[UploadFile] = File(...),
    module_notes: List[UploadFile] = File(...),   # all module note files flat
    module_notes_map: str = Form(...),   # JSON: { module_name: [filename, ...] }
):
    """
    Accepts:
      - subject name
      - past papers (common across all modules)
      - module notes (uploaded flat, mapped by module_notes_map)
      - module_names: ["Module 1", "Module 2", ...]
      - module_notes_map: { "Module 1": ["notes1.pdf"], "Module 2": ["notes2.pdf"] }
    Returns predicted questions per module.
    """
    try:
        modules = json.loads(module_names)
        notes_map = json.loads(module_notes_map)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON in module_names or module_notes_map")

    # Extract past paper text
    past_paper_texts = []
    for f in past_papers:
        content = await f.read()
        text = extract_text_from_pdf(content)
        past_paper_texts.append(text)
    combined_past_papers = "\n\n---\n\n".join(past_paper_texts)

    # Extract notes text per file, keyed by filename
    notes_by_filename = {}
    for f in module_notes:
        content = await f.read()
        text = extract_text_from_pdf(content)
        notes_by_filename[f.filename] = text

    # Build per-module notes text
    module_notes_text = {}
    for module in modules:
        filenames = notes_map.get(module, [])
        texts = [notes_by_filename[fn] for fn in filenames if fn in notes_by_filename]
        module_notes_text[module] = "\n\n".join(texts) if texts else ""

    # Predict per module
    results = {}
    for module in modules:
        questions = await predict_questions(
            subject=subject,
            module=module,
            past_papers_text=combined_past_papers,
            notes_text=module_notes_text[module],
        )
        results[module] = questions

    return JSONResponse(content={"subject": subject, "predictions": results})


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)