import fitz  # PyMuPDF


def extract_text_from_pdf(file_bytes: bytes) -> str:
    """
    Extracts plain text from a PDF given its raw bytes.
    Falls back gracefully if a page has no text (e.g. scanned image pages).
    """
    text_parts = []
    try:
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        for page_num, page in enumerate(doc, start=1):
            page_text = page.get_text("text").strip()
            if page_text:
                text_parts.append(f"[Page {page_num}]\n{page_text}")
            else:
                text_parts.append(f"[Page {page_num}] (no extractable text — possibly scanned)")
        doc.close()
    except Exception as e:
        return f"[PDF parse error: {e}]"

    return "\n\n".join(text_parts)
