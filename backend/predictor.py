import os
import json
import httpx
from typing import List, Dict, Any

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_URL = (
    "https://generativelanguage.googleapis.com/v1beta/models/"
    "gemini-2.5-flash:generateContent"
)

SYSTEM_PROMPT = """You are an expert university exam question predictor.
Your job is to analyze past exam papers and module notes, then predict the most likely CONCEPTS to be tested in an upcoming exam.

Key insight: University exam questions rarely repeat word-for-word, but the same underlying CONCEPT gets tested repeatedly in different forms.
Your job is to identify these recurring concepts and write ONE representative question that best captures how that concept is typically examined.

Rules:
- Identify concepts that appear across multiple past papers (even if worded differently each time).
- Write one question per concept that represents the most likely way it will be examined.
- The question should be specific enough to be useful, not a vague topic name.
- Only predict concepts relevant to the given module's notes.
- Return ONLY valid JSON, no markdown, no explanation outside JSON.
"""

PREDICT_TEMPLATE = """Subject: {subject}
Module: {module}

=== PAST EXAM PAPERS (common for all modules) ===
{past_papers}

=== MODULE NOTES (for {module} only) ===
{notes}

=== TASK ===
Analyze the past papers to find recurring CONCEPTS tested in {module}.
Group similar questions across different years under the same concept.
Then predict 4 concept-based questions: 2 high confidence, 1 medium, 1 low.

Return a JSON object in EXACTLY this format:
{{
  "module": "{module}",
  "topics_identified": ["topic1", "topic2", "topic3"],
  "questions": [
    {{
      "id": 1,
      "question": "One representative question that best captures how this concept is typically examined",
      "topic": "Concept name",
      "type": "theory | numerical | MCQ | short-answer",
      "confidence": "high | medium | low",
      "reason": "Why this concept is likely — e.g. appeared across multiple papers in different forms"
    }}
  ]
}}

IMPORTANT - strictly follow these rules:
- Group questions from different years that test the same underlying concept — write only ONE question representing that concept.
- "high": maximum 2 questions. Concepts tested repeatedly across past papers.
- "medium": exactly 1 question. Concept tested once or covered heavily in notes.
- "low": exactly 1 question. Concept only in notes or tested long ago.
- Total: exactly 4 questions (2 high + 1 medium + 1 low).
- Never exceed 2 high confidence questions.
"""


async def predict_questions(
    subject: str,
    module: str,
    past_papers_text: str,
    notes_text: str,
) -> Dict[str, Any]:
    if not GEMINI_API_KEY:
        raise RuntimeError("GEMINI_API_KEY not set in environment")

    # Truncate to stay within token limits (~800k chars ≈ safe for 1M token window)
    past_papers_text = past_papers_text[:400_000]
    notes_text = notes_text[:200_000]

    prompt = PREDICT_TEMPLATE.format(
        subject=subject,
        module=module,
        past_papers=past_papers_text if past_papers_text.strip() else "No past papers provided.",
        notes=notes_text if notes_text.strip() else "No notes provided.",
    )

    payload = {
        "system_instruction": {"parts": [{"text": SYSTEM_PROMPT}]},
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.4,
            "maxOutputTokens": 8192,
        },
    }

    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            f"{GEMINI_URL}?key={GEMINI_API_KEY}",
            json=payload,
            headers={"Content-Type": "application/json"},
        )

    if response.status_code != 200:
        raise RuntimeError(f"Gemini API error {response.status_code}: {response.text}")

    data = response.json()
    raw_text = data["candidates"][0]["content"]["parts"][0]["text"].strip()

    # Strip markdown code fences if present
    if "```" in raw_text:
        parts = raw_text.split("```")
        for part in parts:
            part = part.strip()
            if part.startswith("json"):
                part = part[4:].strip()
            if part.startswith("{"):
                raw_text = part
                break

    try:
        return json.loads(raw_text)
    except json.JSONDecodeError:
        # Try to extract JSON object from anywhere in the response
        start = raw_text.find("{")
        end = raw_text.rfind("}") + 1
        if start != -1 and end > start:
            try:
                return json.loads(raw_text[start:end])
            except json.JSONDecodeError:
                pass
        # Return raw text wrapped so frontend can still display something
        return {
            "module": module,
            "topics_identified": [],
            "questions": [],
            "raw_response": raw_text,
            "parse_error": True,
        }